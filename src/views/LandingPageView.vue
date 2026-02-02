<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const loading = ref(true)

// STATE DATA
const stats = ref({
  students: 0,
  mentors: 0,
  courses: 0,
  rating: 4.9
})
const testimonials = ref([])
const featuredCourses = ref([])

// FETCH DATA
onMounted(async () => {
  try {
    // 1. Ambil Statistik
    const [studentsRes, mentorsRes, coursesRes, testimonialsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('mentors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      // Ambil testimonial yg APPROVED saja
      supabase.from('testimonials').select(`*, profiles:user_id ( full_name, avatar_url )`).eq('status', 'approved').limit(3)
    ])

    stats.value.students = studentsRes.count || 120 // Fallback angka cantik
    stats.value.mentors = mentorsRes.count || 15
    stats.value.courses = coursesRes.count || 50
    
    if (testimonialsRes.data) {
      testimonials.value = testimonialsRes.data.map(t => ({
        ...t,
        // Ambil data user dari tabel profiles
        name: t.profiles?.full_name || 'Anonymous User',
        avatar_url: t.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User'
      }))
    }

    // 2. Ambil Kursus Unggulan (Top 3 Published)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, instructor_name, image_url, category, price')
      .eq('is_published', true) // HANYA YG PUBLISHED
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (courses) featuredCourses.value = courses

  } catch (error) {
    console.error("Error loading landing data:", error)
  } finally {
    loading.value = false
  }
})

const goToLogin = () => router.push('/auth')
const formatPrice = (price) => price === 0 ? 'Free' : `$${price}`
</script>

<template>
  <div class="min-h-screen font-sans bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 transition-colors duration-300">
    
    <nav class="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3 text-2xl font-bold text-[#1a1b41] dark:text-white">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00d4e3] to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i class="fa-solid fa-shapes"></i>
          </div>
          <span class="tracking-tight hidden md:block">MINDCRAFTED</span>
        </div>
        
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00d4e3] dark:hover:text-[#00d4e3] transition-colors">Features</a>
          <a href="#courses" class="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00d4e3] dark:hover:text-[#00d4e3] transition-colors">Courses</a>
          <a href="#mentors" class="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00d4e3] dark:hover:text-[#00d4e3] transition-colors">Mentors</a>
        </div>

        <button @click="goToLogin" class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
          Get Started
        </button>
      </div>
    </nav>

    <header class="relative pt-40 pb-20 px-6 overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00d4e3]/20 dark:bg-[#00d4e3]/10 rounded-full blur-[120px] -z-10"></div>

      <div class="max-w-5xl mx-auto text-center relative z-10">
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          #1 Future Learning Platform
        </span>
        
        <h1 class="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight dark:text-white">
          Master New Skills <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4e3] via-blue-500 to-purple-600 animate-gradient">
            Build Your Legacy
          </span>
        </h1>
        
        <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Unlock your potential with expert-led courses, real-time mentoring, and a vibrant community of creators.
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button @click="goToLogin" class="bg-[#00d4e3] text-[#1a1b41] px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-[#00d4e3]/30 hover:-translate-y-1 transition-all">
            Start Learning Free
          </button>
          <button class="px-8 py-4 rounded-2xl font-bold text-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
            <i class="fa-solid fa-play-circle text-xl"></i> Watch Demo
          </button>
        </div>
      </div>

      <div class="max-w-5xl mx-auto mt-20 p-8 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-200 dark:divide-slate-700/50">
          <div>
            <h3 class="text-3xl font-bold text-[#1a1b41] dark:text-white">{{ stats.students }}+</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Learners</p>
          </div>
          <div>
            <h3 class="text-3xl font-bold text-[#1a1b41] dark:text-white">{{ stats.mentors }}+</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Experts</p>
          </div>
          <div>
            <h3 class="text-3xl font-bold text-[#1a1b41] dark:text-white">{{ stats.courses }}+</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Courses</p>
          </div>
          <div>
            <h3 class="text-3xl font-bold text-[#1a1b41] dark:text-white flex justify-center items-center gap-2">
              {{ stats.rating }} <i class="fa-solid fa-star text-amber-400 text-xl"></i>
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Satisfaction</p>
          </div>
        </div>
      </div>
    </header>

    <section id="courses" class="py-20 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-12">
          <div>
            <span class="text-[#00d4e3] font-bold text-sm uppercase tracking-wider">Trending Now</span>
            <h2 class="text-3xl font-bold text-[#1a1b41] dark:text-white mt-2">Latest Courses</h2>
          </div>
        </div>

        <div v-if="loading" class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i></div>
        
        <div v-else-if="featuredCourses.length === 0" class="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-3xl">
           <i class="fa-solid fa-rocket text-4xl text-slate-300 mb-4"></i>
           <p class="text-slate-500 dark:text-slate-400">Courses are launching soon!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="course in featuredCourses" :key="course.id" class="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
            <div class="h-48 overflow-hidden relative">
              <img :src="course.image_url || 'https://via.placeholder.com/400x300?text=No+Image'" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
              <div class="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1a1b41] dark:text-white shadow-sm">
                {{ formatPrice(course.price) }}
              </div>
            </div>
            <div class="p-6">
              <span class="text-xs font-bold text-[#00d4e3] uppercase">{{ course.category || 'General' }}</span>
              <h3 class="text-lg font-bold text-[#1a1b41] dark:text-white mt-2 mb-3 line-clamp-2">{{ course.title }}</h3>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                  {{ (course.instructor_name || 'U').charAt(0) }}
                </div>
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ course.instructor_name || 'Unknown Instructor' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 px-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#1a1b41] to-[#0f172a] -z-20"></div>
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00d4e3]/10 rounded-full blur-[120px] -z-10"></div>

      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-white mb-4">Success Stories</h2>
        <p class="text-center text-slate-400 mb-16 max-w-xl mx-auto">See how Mindcrafted is transforming careers around the globe.</p>
        
        <div v-if="testimonials.length === 0" class="text-center text-white/50">
           <p>Be the first to share your story!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="t in testimonials" :key="t.id" class="bg-white/5 p-8 rounded-3xl backdrop-blur-md border border-white/10 hover:border-[#00d4e3]/50 transition-colors">
            <div class="flex text-[#00d4e3] text-xs mb-6">
              <i v-for="n in t.rating" :key="n" class="fa-solid fa-star"></i>
            </div>
            <p class="text-slate-300 text-sm mb-8 leading-relaxed italic">"{{ t.content }}"</p>
            <div class="flex items-center gap-4 border-t border-white/10 pt-6">
              <img :src="t.avatar_url" class="w-12 h-12 rounded-full border-2 border-[#00d4e3] object-cover">
              <div>
                <h4 class="font-bold text-white text-sm">{{ t.name }}</h4>
                <p class="text-xs text-slate-400">{{ t.role }} at {{ t.company }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-12 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-6 text-center text-slate-400 text-xs">
        &copy; 2026 Mindcrafted Platform. Built with Vue & Supabase.
      </div>
    </footer>

  </div>
</template>

<style scoped>
.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 5s ease infinite;
}
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>