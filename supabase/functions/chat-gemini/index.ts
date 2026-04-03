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

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})