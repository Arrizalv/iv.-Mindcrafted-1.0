import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages } = await req.json()
    const apiKey = Deno.env.get("GROQ_API_KEY")

    if (!apiKey) throw new Error("API_KEY_MISSING: Lu belum setting GROQ_API_KEY di Supabase Secrets!")

    // Kita coba pake model Llama dulu buat ngetes, karena Qwen kadang suka limit
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Ganti sementara ke Llama yang lebih stabil
        messages: [
          { role: "system", content: "Kamu asisten Mindcrafted AI." },
          ...messages
        ]
      })
    })

    const data = await response.json()

    // Kalau Groq ngasih error (misal: API Key salah), kita kirim infonya ke Vue
    if (data.error) {
      console.error("Groq Error:", data.error)
      return new Response(
        JSON.stringify({ reply: `❌ Groq Error: ${data.error.message}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ reply: data.choices[0].message.content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ reply: `⚠️ System Error: ${error.message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})