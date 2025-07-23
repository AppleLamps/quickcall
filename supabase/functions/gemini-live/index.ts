
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

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

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member.",
    });

    let liveSession: any = null;
    
    socket.onopen = async () => {
      console.log("Client connected to relay");
      
      try {
        // Create live session with proper configuration
        liveSession = await model.createLiveSession({
          config: {
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede"
                }
              }
            },
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede"
                  }
                }
              }
            }
          }
        });

        console.log("Live session created successfully");
        
        // Handle incoming messages from Gemini
        for await (const response of liveSession.receiveAll()) {
          console.log("Received from Gemini:", response);
          
          // Forward all messages to client
          socket.send(JSON.stringify(response));
        }
        
      } catch (error) {
        console.error("Error creating live session:", error);
        socket.close(1008, "Failed to create live session");
      }
    };

    socket.onmessage = async (event) => {
      console.log("Message from client:", event.data);
      
      if (!liveSession) {
        console.error("Live session not initialized");
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        // Forward client messages to Gemini Live session
        await liveSession.send(data);
        
      } catch (error) {
        console.error("Error parsing/sending client message:", error);
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
