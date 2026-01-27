<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">AI Learning Path Generator 🚀</h1>
      <p class="text-gray-600">Bingung mulai dari mana? Biar AI buatin kurikulum khusus buat kamu.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md mb-8">
      <label class="block mb-2 font-medium">Kamu ingin fokus belajar apa?</label>
      <div class="flex gap-4">
        <input 
          v-model="topic" 
          type="text" 
          placeholder="Contoh: Backend Golang, Data Science Python..." 
          class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          @keyup.enter="generateRoadmap"
        />
        <button 
          @click="generateRoadmap" 
          :disabled="loading || !topic"
          class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
        >
          {{ loading ? 'Meracik...' : 'Generate' }}
        </button>
      </div>
    </div>

    <div v-if="mermaidCode" class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Roadmap: {{ topic }}</h2>
        <button 
          @click="downloadPDF"
          class="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <span>⬇️ Download PDF</span>
        </button>
      </div>

      <div id="roadmap-canvas" class="p-4 border border-gray-100 rounded bg-white overflow-x-auto">
        <div class="mermaid" ref="mermaidRef">
          {{ mermaidCode }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import mermaid from 'mermaid'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase' // Import dari struktur lib lu

const topic = ref('')
const loading = ref(false)
const mermaidCode = ref('')
const mermaidRef = ref<HTMLElement | null>(null)

// Setup Mermaid
onMounted(() => {
  mermaid.initialize({ 
    startOnLoad: false, 
    theme: 'default',
    securityLevel: 'loose',
  })
})

async function generateRoadmap() {
  if (!topic.value) return
  
  loading.value = true
  mermaidCode.value = '' // Reset dulu

  try {
    // Panggil Supabase Edge Function
    // Pastikan lu udah deploy function 'generate-roadmap' (lihat langkah di bawah)
    const { data, error } = await supabase.functions.invoke('generate-roadmap', {
      body: { topic: topic.value }
    })

    if (error) throw error

    // Cleaning data dari AI (kadang AI ngebungkus pake markdown ```mermaid)
    let rawCode = data.roadmap || ''
    rawCode = rawCode.replace(/```mermaid/g, '').replace(/```/g, '').trim()
    
    mermaidCode.value = rawCode

    // Render ulang diagram
    await nextTick()
    if (mermaidRef.value) {
      mermaidRef.value.removeAttribute('data-processed')
      await mermaid.run({ nodes: [mermaidRef.value] })
    }

  } catch (err) {
    console.error('Error generating roadmap:', err)
    alert('Gagal membuat roadmap. Cek console atau coba lagi.')
  } finally {
    loading.value = false
  }
}

async function downloadPDF() {
  const element = document.getElementById('roadmap-canvas')
  if (!element) return

  try {
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    
    const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`Roadmap-${topic.value}.pdf`)
  } catch (err) {
    console.error('Gagal download PDF:', err)
  }
}
</script>

<style scoped>
/* Styling tambahan kalau perlu */
</style>