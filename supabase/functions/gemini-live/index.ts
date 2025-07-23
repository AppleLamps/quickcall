import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// This is a necessary Deno polyfill for the Gemini SDK
globalThis.WebSocket = WebSocket;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Request isn't trying to upgrade to a WebSocket.", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in Supabase secrets.");
    // The 1008 policy violation code is appropriate here.
    socket.close(1008, "API key not configured");
    // Return the response to complete the WebSocket upgrade handshake.
    return response;
  }

  let liveSession: any = null;

  socket.onopen = async () => {
    console.log("Client connected to relay.");
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-preview-native-audio-dialog" });

      liveSession = await model.createLiveSession({
        response_modalities: ["AUDIO"],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: "Aoede"
            }
          }
        },
        system_instruction: {
          parts: [{
            text: "You are an AI assistant helping someone escape from an awkward situation by pretending to be their emergency contact. Keep the conversation natural and believable. Ask about their location, if they need help, and create a realistic scenario that would require them to leave immediately. Speak in a concerned, caring tone as if you're a close friend or family member."
          }]
        }
      });

      console.log("Successfully created Gemini Live session.");

      // Forward messages from Gemini to the client
      liveSession.addEventListener("message", (message: any) => {
        // The message from the SDK is already in the correct format.
        socket.send(JSON.stringify(message));
      });

      liveSession.addEventListener("close", () => {
        console.log("Gemini live session closed.");
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      });

      liveSession.addEventListener("error", (event: any) => {
        console.error("Gemini live session error:", event);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1011, "An error occurred with the Gemini API session.");
        }
      });

    } catch (error) {
      console.error("Failed to create Gemini Live session:", error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1008, "Failed to initialize Gemini Live session.");
      }
    }
  };

  socket.onmessage = (event) => {
    if (liveSession) {
      // Forward messages from the client directly to the Gemini session
      liveSession.send(event.data);
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
});
