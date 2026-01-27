import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 1. Setup CORS Headers (PENTING BIAR GAK ERROR MERAH DI BROWSER)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 2. Handle Preflight Request (Browser nge-cek izin dulu)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ambil data dari Frontend
    const { topic } = await req.json()
    
    // Pastikan API Key ada
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error("API Key Gemini belum di-set di Supabase Secrets")
    }

    // 3. Prompt Engineering Khusus Gemini
    // Kita minta format text polos (plain text) biar gampang di-parsing
    const prompt = `
      Bertindaklah sebagai Senior Developer & Mentor.
      Buatkan roadmap belajar untuk topik: "${topic}".
      
      ATURAN WAJIB:
      1. Output HANYA boleh berupa kode diagram flowchart MERMAID.JS (graph TD).
      2. JANGAN pakai markdown block (jangan pakai tanda \`\`\`).
      3. JANGAN ada kata-kata pembuka atau penutup. Langsung kode mermaid saja.
      4. Buat alur dari Beginner --> Intermediate --> Advanced.
      
      Contoh output yang benar:
      graph TD
        A[Start] --> B[Basics]
        B --> C[Advanced]
    `

    // 4. Request ke Google Gemini API (Model 1.5 Flash - Cepat & Murah)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    })

    const data = await response.json()

    // Cek jika Google balikin error
    if (!response.ok) {
      console.error("Gemini Error:", data)
      throw new Error(data.error?.message || "Gagal menghubungi Gemini")
    }

    // 5. Ambil text dari struktur JSON Gemini
    // Structure: candidates[0].content.parts[0].text
    let roadmapCode = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // Bersihkan sisa-sisa markdown jika Gemini bandel
    roadmapCode = roadmapCode.replace(/```mermaid/g, '').replace(/```/g, '').trim()

    // 6. Kirim balik ke Vue
    return new Response(
      JSON.stringify({ roadmap: roadmapCode }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 // Internal Server Error
      },
    )
  }
})