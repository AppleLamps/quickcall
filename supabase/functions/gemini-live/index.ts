
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
    
    socket.onopen = () => {
      console.log("Client connected to relay");
      
      // Connect to Gemini Live API with correct endpoint
      const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
      geminiSocket = new WebSocket(geminiUrl);
      
      geminiSocket.onopen = () => {
        console.log("Connected to Gemini Live API");
        
        // Send setup message with correct model and 24kHz output
        const setupMessage = {
          setup: {
            model: "models/gemini-2.5-flash-preview-native-audio-dialog",
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
            tools: [],
            system_instruction: {
              parts: [
                {
                  text: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member."
                }
              ]
            }
          }
        };
        
        geminiSocket.send(JSON.stringify(setupMessage));
      };

      geminiSocket.onmessage = (event) => {
        console.log("Message from Gemini:", event.data);
        try {
          const data = JSON.parse(event.data);
          
          // Forward all messages to client
          socket.send(event.data);
          
          // Log setup completion
          if (data.setupComplete) {
            console.log("Gemini setup completed successfully");
          }
          
        } catch (error) {
          console.error("Error parsing Gemini message:", error);
        }
      };

      geminiSocket.onclose = (event) => {
        console.log("Gemini connection closed:", event.code, event.reason);
        socket.close(event.code, event.reason);
      };

      geminiSocket.onerror = (error) => {
        console.error("Gemini WebSocket error:", error);
        socket.close(1008, "Gemini API connection error");
      };
    };

    socket.onmessage = (event) => {
      console.log("Message from client:", event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
          geminiSocket.send(event.data);
        } else {
          console.error("Gemini socket not ready, state:", geminiSocket?.readyState);
        }
      } catch (error) {
        console.error("Error parsing client message:", error);
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
