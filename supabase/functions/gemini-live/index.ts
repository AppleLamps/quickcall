
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    let geminiSocket: WebSocket | null = null;
    let isSetupComplete = false;
    
    socket.onopen = async () => {
      console.log("Client connected to relay");
      
      try {
        // Connect to Gemini Live API using the correct WebSocket URL
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
        
        console.log("Connecting to Gemini Live API...");
        geminiSocket = new WebSocket(geminiUrl);

        geminiSocket.onopen = () => {
          console.log("Connected to Gemini Live API");
          
          // Send initial setup message with correct format
          const setupMessage = {
            setup: {
              model: "models/gemini-2.0-flash-exp",
              generation_config: {
                response_modalities: ["AUDIO"],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: "Aoede"
                    }
                  }
                }
              },
              system_instruction: {
                parts: [{
                  text: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member. Keep responses concise and realistic for a phone call."
                }]
              }
            }
          };
          
          console.log("Sending setup message to Gemini Live API");
          geminiSocket.send(JSON.stringify(setupMessage));
        };

        geminiSocket.onmessage = (event) => {
          console.log("Received from Gemini Live API:", event.data);
          
          try {
            const data = JSON.parse(event.data);
            
            // Handle setup completion
            if (data.setupComplete) {
              console.log("Gemini Live setup completed successfully");
              isSetupComplete = true;
              socket.send(JSON.stringify({ 
                type: "setup_complete",
                message: "Gemini Live API ready for conversation"
              }));
              return;
            }
            
            // Handle server content (AI responses)
            if (data.serverContent) {
              console.log("Processing server content:", data.serverContent);
              
              const { modelTurn, turnComplete } = data.serverContent;
              
              // Process model turn with audio data
              if (modelTurn?.parts) {
                modelTurn.parts.forEach((part: any) => {
                  if (part.inlineData?.mimeType === 'audio/pcm' && part.inlineData?.data) {
                    console.log("Forwarding audio data to client");
                    socket.send(JSON.stringify({
                      type: "audio_response",
                      audioData: part.inlineData.data,
                      mimeType: part.inlineData.mimeType
                    }));
                  }
                  
                  if (part.text) {
                    console.log("Forwarding text response to client");
                    socket.send(JSON.stringify({
                      type: "text_response",
                      text: part.text
                    }));
                  }
                });
              }
              
              // Handle turn completion
              if (turnComplete) {
                console.log("AI turn completed");
                socket.send(JSON.stringify({
                  type: "turn_complete",
                  message: "AI finished speaking"
                }));
              }
            }
            
            // Handle any errors from Gemini
            if (data.error) {
              console.error("Gemini API error:", data.error);
              socket.send(JSON.stringify({
                type: "error",
                error: data.error
              }));
            }
            
          } catch (error) {
            console.error("Error parsing Gemini response:", error);
            socket.send(JSON.stringify({ 
              type: "error", 
              error: "Failed to parse Gemini response" 
            }));
          }
        };

        geminiSocket.onclose = (event) => {
          console.log("Gemini Live API connection closed:", event.code, event.reason);
          socket.close(event.code, event.reason);
        };

        geminiSocket.onerror = (error) => {
          console.error("Gemini Live API WebSocket error:", error);
          socket.close(1008, "Gemini API connection failed");
        };
        
      } catch (error) {
        console.error("Error connecting to Gemini Live API:", error);
        socket.close(1008, "Failed to connect to Gemini Live API");
      }
    };

    socket.onmessage = async (event) => {
      console.log("Message from client:", event.data);
      
      if (!geminiSocket || geminiSocket.readyState !== WebSocket.OPEN) {
        console.error("Gemini Live API connection not ready");
        return;
      }

      if (!isSetupComplete) {
        console.log("Setup not complete, ignoring message");
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        // Handle audio input from client
        if (data.type === "audio_input" && data.audioData) {
          console.log("Forwarding audio input to Gemini Live API");
          
          const realtimeInput = {
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: data.audioData
              }]
            }
          };
          
          geminiSocket.send(JSON.stringify(realtimeInput));
        }
        
        // Handle turn completion signal from client
        if (data.type === "turn_complete") {
          console.log("Client signaled turn complete");
          
          // Send empty media chunks to signal end of turn
          const turnCompleteMessage = {
            realtimeInput: {
              mediaChunks: []
            }
          };
          
          geminiSocket.send(JSON.stringify(turnCompleteMessage));
        }
        
      } catch (error) {
        console.error("Error processing client message:", error);
      }
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
      if (geminiSocket) {
        geminiSocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
      if (geminiSocket) {
        geminiSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket upgrade error:", error);
    return new Response("WebSocket upgrade failed", { status: 500 });
  }
});
