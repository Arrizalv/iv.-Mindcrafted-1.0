import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Terima array messages (History chat) dari Frontend
    // Format dari Frontend: [{ role: 'user', content: 'Halo' }, ...]
    const { messages } = await req.json()

    // Transformasi format pesan biar sesuai standar Google Gemini
    // Gemini mau format: { role: 'user'|'model', parts: [{ text: '...' }] }
    const formattedHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Panggil Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedHistory, // Kirim seluruh history biar dia punya konteks
          generationConfig: {
            temperature: 0.7, // Kreativitas sedang
            maxOutputTokens: 1000,
          }
        })
      }
    )

    const data = await response.json()
    
    // Ambil balasan AI
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya sedang pusing. Coba lagi nanti."

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})