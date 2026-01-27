<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useUser } from '../composables/useUser'

// 1. Setup Composable & Router
const router = useRouter()
const { userRoles, hasRole } = useUser() // Ambil fungsi hasRole dari sini

// 2. State Data
const myCourses = ref([])
const userStats = ref({}) // Data profil user
const pendingCount = ref(0) // Data notifikasi admin

// Data Dummy Statistik (Biar grid stats ngga error)
const stats = ref([
  { title: 'Courses Completed', count: '12', icon: 'fa-trophy', change: '+2 this month' },
  { title: 'Learning Hours', count: '48.5', icon: 'fa-clock', change: '+12% vs last month' },
  { title: 'Points Earned', count: '1,250', icon: 'fa-medal', change: 'Top 5% student' },
  { title: 'Skills Mastered', count: '8', icon: 'fa-brain', change: 'New: React.js' }
])

// 3. Computed Property (Harus di luar function biar reaktif)
const isExpert = computed(() => {
  return hasRole('instructor') || hasRole('mentor') || hasRole('admin')
})

// 4. Fetch Data Utama
async function fetchDashboardData() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Ambil Profil User
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    userStats.value = profile

    // Ambil Course yang sedang dipelajari
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            progress_percent,
            courses ( title, instructor_name, image_url )
        `)
        .eq('user_id', user.id)
    
    if (enrollments) myCourses.value = enrollments
  }
}

// 5. Fetch Data Khusus Admin (Hitung lamaran pending)
const fetchAdminStats = async () => {
  if (hasRole('admin')) {
    const { count, error } = await supabase
      .from('role_applications')
      .select('*', { count: 'exact', head: true }) 
      .eq('status', 'pending')
    
    if (!error) pendingCount.value = count || 0
  }
}

onMounted(() => {
  fetchDashboardData()
  fetchAdminStats()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Welcome back, {{ userStats?.full_name || 'User' }} 👋</h1>
      <p class="text-slate-500">Here's what's happening with your platform.</p>
    </div>

    <div v-if="hasRole('admin')" class="mb-10">
      <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Admin Control Center</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          @click="router.push('/admin/applications')"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-md hover:border-[#00d4e3] transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-file-signature"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">Instructor Applications</h3>
              <p class="text-sm text-slate-500 mt-1">Review pending requests.</p>
            </div>
            
            <div v-if="pendingCount > 0" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-200 animate-bounce">
              {{ pendingCount }} Pending
            </div>
            <div v-else class="bg-green-100 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">
              All Clear
            </div>
          </div>
        </div>

        <div 
          @click="router.push('/admin/users')"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-md hover:border-purple-400 transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-users-gear"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 group-hover:text-purple-600 transition-colors">User Management</h3>
              <p class="text-sm text-slate-500 mt-1">Manage roles & users.</p>
            </div>
          </div>
        </div>
        <div 
          @click="router.push('/admin/courses')"
          class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-md hover:border-orange-400 transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-layer-group"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors">Course Manager</h3>
              <p class="text-sm text-slate-500 mt-1">Moderate content & quality.</p>
            </div>
          </div>
          <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </div>
      </div>
    </div>

    <div v-if="!isExpert" class="mb-8 bg-gradient-to-r from-[#1a1b41] to-[#2d2e68] rounded-2xl p-6 md:p-8 relative overflow-hidden text-white shadow-lg">
      <i class="fa-solid fa-shapes absolute -right-10 -bottom-10 text-9xl text-white/5 rotate-12"></i>
      
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span class="bg-[#00d4e3] text-[#1a1b41] text-[10px] font-bold px-2 py-1 rounded mb-3 inline-block">NEW OPPORTUNITY</span>
          <h2 class="text-2xl font-bold mb-2">Share your knowledge & earn money</h2>
          <p class="text-slate-300 text-sm max-w-lg">
            Join our expert team of instructors and mentors. Create courses or provide 1-on-1 mentoring sessions.
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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="(stat, index) in stats" :key="index" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
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
        
        <div v-if="myCourses.length === 0" class="bg-white p-8 rounded-2xl shadow-sm text-center text-slate-400">
            <p>You haven't enrolled in any courses yet.</p>
            <button @click="router.push('/courses')" class="text-[#00d4e3] font-bold mt-2 hover:underline">Explore Courses</button>
        </div>

        <div v-else v-for="course in myCourses" :key="course.id" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex justify-between mb-2">
            <h3 class="font-semibold text-slate-800">{{ course.courses.title }}</h3>
            <span class="font-bold text-sm">{{ course.progress_percent }}%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 mb-4">
            <div class="bg-[#1a1b41] h-2 rounded-full" :style="`width: ${course.progress_percent}%`"></div>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500">Instructor: {{ course.courses.instructor_name }}</span>
            <a href="#" class="font-semibold flex items-center gap-2 hover:text-[#00d4e3]">Continue <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold text-slate-800 mb-4">Upcoming Mentoring</h2>
        <div class="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100">
          <div class="flex gap-3">
            <div class="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-500">AT</div>
            <div>
              <h4 class="text-sm font-semibold">Alex Thompson</h4>
              <p class="text-[10px] text-slate-500">Today, 3:00 PM</p>
            </div>
          </div>
          <button class="bg-[#1a1b41] text-white px-3 py-1.5 rounded text-xs hover:bg-[#00d4e3] hover:text-[#1a1b41] transition">Join</button>
        </div>
      </div>
    </div>

  </div>
</template>