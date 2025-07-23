
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
    
    socket.onopen = async () => {
      console.log("Client connected to relay");
      
      try {
        // Connect directly to Gemini Live API WebSocket endpoint
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
        
        console.log("Connecting to Gemini Live API...");
        geminiSocket = new WebSocket(geminiUrl);

        geminiSocket.onopen = () => {
          console.log("Connected to Gemini Live API");
          
          // Send initial setup message
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
                  text: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member."
                }]
              }
            }
          };
          
          console.log("Sending setup message:", JSON.stringify(setupMessage));
          geminiSocket.send(JSON.stringify(setupMessage));
        };

        geminiSocket.onmessage = (event) => {
          console.log("Received from Gemini Live API:", event.data);
          
          try {
            const data = JSON.parse(event.data);
            
            // Forward all messages to client
            socket.send(JSON.stringify(data));
            
            // Log specific message types for debugging
            if (data.setupComplete) {
              console.log("Gemini Live setup completed");
            }
            
            if (data.serverContent) {
              console.log("Server content received:", data.serverContent);
            }
            
          } catch (error) {
            console.error("Error parsing Gemini response:", error);
            socket.send(JSON.stringify({ error: "Failed to parse Gemini response" }));
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

      try {
        const data = JSON.parse(event.data);
        
        // Forward client messages to Gemini Live API
        console.log("Forwarding to Gemini Live API:", JSON.stringify(data));
        geminiSocket.send(JSON.stringify(data));
        
      } catch (error) {
        console.error("Error parsing/sending client message:", error);
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
