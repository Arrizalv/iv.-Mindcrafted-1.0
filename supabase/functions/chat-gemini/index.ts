import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Setup CORS headers supaya bisa dipanggil dari web Vue kamu
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    // Panggil API Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-2.5-32b", // Model paling gacor buat Bahasa Indonesia di Groq
        messages: [
          { 
            role: "system", 
            content: "Kamu adalah Mindcrafted AI, asisten coding dan karir yang ramah. Jawab dalam Bahasa Indonesia yang santai tapi profesional." 
          },
          ...messages
        ],
        temperature: 0.7
      })
    })

    const data = await response.json()
    
    // Ambil teks balesan dari Groq
    const aiReply = data.choices[0].message.content

    return new Response(
      JSON.stringify({ reply: aiReply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const apiKey = Deno.env.get("GROQ_API_KEY")

    if (!apiKey) {
      console.error("Waduh, GROQ_API_KEY belum dipasang di secrets!")
      throw new Error("API Key missing")
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-2.5-32b",
        messages: [
          { role: "system", content: "Kamu adalah Mindcrafted AI, asisten yang cerdas." },
          ...messages
        ]
      })
    })

    const data = await response.json()
    console.log("Respon dari Groq:", data) // Ini buat debug di logs

    if (data.error) {
      console.error("Error dari Groq API:", data.error)
      throw new Error(data.error.message)
    }

    const aiReply = data.choices?.[0]?.message?.content || "Duh, bot-nya bingung mau jawab apa."

    return new Response(
      JSON.stringify({ reply: aiReply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error di Function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message, reply: "Maaf, lagi ada gangguan teknis." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})