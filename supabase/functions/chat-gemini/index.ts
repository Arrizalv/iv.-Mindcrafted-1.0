import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const apiKey = Deno.env.get("GROQ_API_KEY")

    if (!apiKey) {
      throw new Error("GROQ_API_KEY tidak ditemukan di Secrets Supabase!")
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Kamu adalah Mindcrafted AI, asisten yang cerdas dan santai." },
          ...messages
        ]
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    const aiReply = data.choices?.[0]?.message?.content || "Bot sedang bingung."

    return new Response(
      JSON.stringify({ reply: aiReply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } } catch (error) {
    // Balikin error asli biar kita tau masalahnya apa tanpa buka logs
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        reply: `Aduh! Error nih: ${error.message}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
)