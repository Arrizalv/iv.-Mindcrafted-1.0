<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const testimonials = ref([])

onMounted(async () => {
  const { data } = await supabase.from('testimonials').select('*')
  if (data) testimonials.value = data
})

const goToLogin = () => router.push('/auth')
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-slate-800">
    
    <nav class="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3 text-2xl font-bold text-[#1a1b41]">
          <i class="fa-solid fa-shapes text-[#00d4e3] text-3xl"></i>
          <span>MINDCRAFTED</span>
        </div>
        
        <div class="flex items-center gap-6">
          <a href="#features" class="hidden md:block text-sm font-semibold text-slate-600 hover:text-[#00d4e3]">Features</a>
          <a href="#pricing" class="hidden md:block text-sm font-semibold text-slate-600 hover:text-[#00d4e3]">Pricing</a>
          <button @click="goToLogin" class="bg-[#1a1b41] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#00d4e3] hover:text-[#1a1b41] transition-all shadow-lg shadow-indigo-900/20">
            Login / Sign Up
          </button>
        </div>
      </div>
    </nav>

    <header class="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-slate-50 to-white">
      <div class="max-w-4xl mx-auto">
        <span class="text-[#00d4e3] font-bold tracking-wider text-sm uppercase mb-4 block animate-pulse">#1 Learning Platform</span>
        <h1 class="text-5xl md:text-7xl font-bold text-[#1a1b41] mb-6 leading-tight">
          Master New Skills <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4e3] to-blue-600">Build Your Future</span>
        </h1>
        <p class="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
          Bergabunglah dengan komunitas belajar terbesar. Akses ribuan kursus, mentoring eksklusif, dan diskusi real-time dalam satu platform.
        </p>
        <div class="flex flex-col md:flex-row justify-center gap-4">
          <button @click="goToLogin" class="bg-[#00d4e3] text-[#1a1b41] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            Get Started for Free
          </button>
          <button class="px-8 py-4 rounded-xl font-bold text-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-play"></i> Watch Demo
          </button>
        </div>
      </div>
      
      <div class="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-200 pt-8">
        <div><h3 class="text-3xl font-bold text-[#1a1b41]">10k+</h3><p class="text-slate-500 text-sm">Active Students</p></div>
        <div><h3 class="text-3xl font-bold text-[#1a1b41]">500+</h3><p class="text-slate-500 text-sm">Expert Mentors</p></div>
        <div><h3 class="text-3xl font-bold text-[#1a1b41]">1.2k</h3><p class="text-slate-500 text-sm">Courses</p></div>
        <div><h3 class="text-3xl font-bold text-[#1a1b41]">4.9</h3><p class="text-slate-500 text-sm">User Rating</p></div>
      </div>
    </header>

    <section id="features" class="py-20 px-6 bg-white">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-[#1a1b41] mb-16">Why Choose Mindcrafted?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 group">
            <div class="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">Expert-Led Courses</h3>
            <p class="text-slate-500 leading-relaxed">Belajar langsung dari praktisi industri top dunia dengan kurikulum yang terstruktur.</p>
          </div>
          <div class="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 group">
            <div class="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <i class="fa-solid fa-video"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">1-on-1 Mentoring</h3>
            <p class="text-slate-500 leading-relaxed">Booking sesi privat dengan mentor untuk review portofolio atau konsultasi karir.</p>
          </div>
          <div class="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 group">
            <div class="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 text-2xl mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <i class="fa-solid fa-users"></i>
            </div>
            <h3 class="text-xl font-bold mb-3">Community First</h3>
            <p class="text-slate-500 leading-relaxed">Diskusi real-time, berbagi project, dan networking dengan sesama learner.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 px-6 bg-[#1a1b41] text-white">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-16">What Our Students Say</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="t in testimonials" :key="t.id" class="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
            <div class="flex text-[#00d4e3] text-xs mb-4">
              <i v-for="n in t.rating" :key="n" class="fa-solid fa-star"></i>
            </div>
            <p class="text-slate-300 text-sm mb-6 leading-relaxed">"{{ t.content }}"</p>
            <div class="flex items-center gap-3">
              <img :src="t.avatar_url" class="w-10 h-10 rounded-full border-2 border-[#00d4e3]">
              <div>
                <h4 class="font-bold text-sm">{{ t.name }}</h4>
                <p class="text-xs text-slate-400">{{ t.role }} at {{ t.company }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-10 text-center text-slate-500 text-sm border-t border-slate-100">
      <p>&copy; 2026 Mindcrafted Platform. All rights reserved.</p>
    </footer>
  </div>
</template>