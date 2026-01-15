<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const myCourses = ref([])
const userStats = ref({})


async function fetchDashboardData() {
  // 1. Ambil User saat ini
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // 2. Ambil Profil User
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    userStats.value = profile

    // 3. Ambil Course yang sedang dipelajari (Join Table)
    // Supabase bisa melakukan join otomatis jika foreign key benar
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            progress_percent,
            courses ( title, instructor_name, image_url )
        `)
        .eq('user_id', user.id)
    
    myCourses.value = enrollments
    // Cek apakah user sudah jadi 'orang dalam' (Instructor/Mentor/Admin)
    const isExpert = computed(() => {
      return hasRole('instructor') || hasRole('mentor') || hasRole('admin')
    })
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Welcome back, {{ userProfile?.full_name || 'User' }}👋</h1>
      <p class="text-slate-500">Here's what's happening with your learning journey</p>
    </div>

    <div class="grid grid-cols-4 gap-6 mb-8">
      <div v-for="(stat, index) in stats" :key="index" class="bg-white p-5 rounded-2xl shadow-sm">
        <div class="flex justify-between text-slate-500 text-sm mb-4">
          <span>{{ stat.title }}</span>
          <i :class="`fa-solid ${stat.icon} text-[#00d4e3]`"></i>
        </div>
        <div class="text-3xl font-bold text-slate-800 mb-1">{{ stat.count }}</div>
        <div class="text-xs text-green-500 font-medium">{{ stat.change }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <div class="lg:col-span-2 space-y-4">
        <h2 class="text-lg font-bold text-slate-800">Active Courses</h2>
        <div class="bg-white p-5 rounded-2xl shadow-sm">
          <div class="flex justify-between mb-2">
            <h3 class="font-semibold text-slate-800">Advanced React Patterns</h3>
            <span class="font-bold text-sm">65%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 mb-4">
            <div class="bg-[#1a1b41] h-2 rounded-full" style="width: 65%"></div>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">Next: Context API</span>
            <a href="#" class="font-semibold flex items-center gap-2 hover:text-[#00d4e3]">Continue <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold text-slate-800 mb-4">Upcoming Mentoring</h2>
        <div class="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between m-4">
          <div class="flex gap-3">
            <div class="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-500">AT</div>
            <div>
              <h4 class="text-sm font-semibold">Alex Thompson</h4>
              <p class="text-[10px] text-slate-500">Today, 3:00 PM</p>
            </div>
          </div>
          <button class="bg-[#1a1b41] text-white px-3 py-1.5 rounded text-xs">Join</button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="!isExpert" class="mb-8 bg-gradient-to-r from-[#1a1b41] to-[#2d2e68] rounded-2xl p-6 md:p-8 relative overflow-hidden text-white shadow-lg">
      <i class="fa-solid fa-shapes absolute -right-10 -bottom-10 text-9xl text-white/5 rotate-12"></i>
      
      <div class="relative flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span class="bg-[#00d4e3] text-[#1a1b41] text-[10px] font-bold px-2 py-1 rounded mb-3 inline-block">NEW OPPORTUNITY</span>
          <h2 class="text-2xl font-bold mb-2">Share your knowledge & earn money</h2>
          <p class="text-slate-300 text-sm max-w-lg">
            Join our expert team of instructors and mentors. Create courses or provide 1-on-1 mentoring sessions to students worldwide.
          </p>
        </div>
        <button 
          @click="router.push('/apply-instructor')" 
          class="bg-white text-[#1a1b41] px-6 py-3 rounded-xl font-bold hover:bg-[#00d4e3] hover:shadow-lg transition-all whitespace-nowrap"
        >
          Become an Instructor <i class="fa-solid fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6 mb-8">
       </div>
</template>