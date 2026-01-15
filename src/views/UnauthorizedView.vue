<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
      <i class="fa-solid fa-lock text-4xl text-red-500"></i>
    </div>
    
    <h1 class="text-4xl font-bold text-slate-800 mb-2">Access Denied</h1>
    <p class="text-slate-500 mb-8 max-w-md">
      Oops! Kamu tidak memiliki izin untuk mengakses area ini. Halaman ini khusus untuk Role tertentu (Instructor/Admin).
    </p>
    
    <div class="flex gap-4">
      <button 
        @click="router.push('/dashboard')" 
        class="bg-[#1a1b41] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
      >
        Back to Dashboard
      </button>
      <button 
        @click="router.go(-1)" 
        class="px-6 py-3 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-white transition-all"
      >
        Go Back
      </button>
    </div>
  </div>
</template>