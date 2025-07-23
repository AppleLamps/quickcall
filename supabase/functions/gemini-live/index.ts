
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      socket.close(1008, "API key not configured");
      return response;
    }

    let liveSession: any = null;
    let isConnected = false;
    
    socket.onopen = async () => {
      console.log("Client connected to relay");
      
      try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // Create a live session using the official SDK
        liveSession = await genAI.createLiveSession({
          model: "gemini-2.5-flash-preview-native-audio-dialog",
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede"
                }
              }
            },
            systemInstruction: {
              parts: [{
                text: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member. Keep responses concise and realistic for a phone call."
              }]
            }
          }
        });

        console.log("Gemini Live session created successfully");
        isConnected = true;
        
        // Notify client that setup is complete
        socket.send(JSON.stringify({ 
          type: "setup_complete",
          message: "Gemini Live API ready for conversation"
        }));

        // Handle responses from Gemini Live
        liveSession.on('response', (response: any) => {
          console.log("Received response from Gemini Live:", response);
          
          if (response.audioData) {
            console.log("Forwarding audio data to client");
            socket.send(JSON.stringify({
              type: "audio_response",
              audioData: response.audioData,
              mimeType: response.mimeType || 'audio/pcm'
            }));
          }
          
          if (response.text) {
            console.log("Forwarding text response to client");
            socket.send(JSON.stringify({
              type: "text_response",
              text: response.text
            }));
          }
          
          if (response.turnComplete) {
            console.log("AI turn completed");
            socket.send(JSON.stringify({
              type: "turn_complete",
              message: "AI finished speaking"
            }));
          }
        });

        // Handle errors from Gemini Live
        liveSession.on('error', (error: any) => {
          console.error("Gemini Live API error:", error);
          socket.send(JSON.stringify({
            type: "error",
            error: error.message || "Gemini API error"
          }));
        });

        // Handle session end
        liveSession.on('close', () => {
          console.log("Gemini Live session closed");
          isConnected = false;
          socket.close(1000, "Session ended");
        });
        
      } catch (error) {
        console.error("Error creating Gemini Live session:", error);
        socket.close(1008, "Failed to create Gemini Live session");
      }
    };

    socket.onmessage = async (event) => {
      console.log("Message from client:", event.data);
      
      if (!liveSession || !isConnected) {
        console.error("Gemini Live session not ready");
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        // Handle audio input from client
        if (data.type === "audio_input" && data.audioData) {
          console.log("Forwarding audio input to Gemini Live");
          
          // Convert base64 audio data back to binary
          const audioBuffer = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
          
          // Send audio to Gemini Live session
          await liveSession.sendAudio(audioBuffer);
        }
        
        // Handle turn completion signal from client
        if (data.type === "turn_complete") {
          console.log("Client signaled turn complete");
          await liveSession.endTurn();
        }
        
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
      if (liveSession) {
        liveSession.close();
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
      if (liveSession) {
        liveSession.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket upgrade error:", error);
    return new Response("WebSocket upgrade failed", { status: 500 });
  }
});
