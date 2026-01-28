<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useUser } from '../composables/useUser'

// 1. Setup Composable & Router
const router = useRouter()
const { userRoles, hasRole } = useUser()

// 2. State Data
const myCourses = ref([])
const upcomingSessions = ref([]) // Data mentoring real
const userStats = ref({}) 
const pendingCount = ref(0)
const loading = ref(true)

// Data Statistik (Gabungan Real & Dummy)
const stats = ref([
  { title: 'Courses Enrolled', count: '0', icon: 'fa-book-open', change: 'Active learning', isReal: true },
  { title: 'Learning Hours', count: '12.5', icon: 'fa-clock', change: '+2h this week', isReal: false }, // Masih dummy (susah ngitung jam real)
  { title: 'Points Earned', count: '850', icon: 'fa-medal', change: 'Level 3 Scholar', isReal: false },
  { title: 'Certificates', count: '2', icon: 'fa-certificate', change: 'Verified', isReal: false }
])

// 3. Computed Property
const isExpert = computed(() => {
  return hasRole('instructor') || hasRole('mentor') || hasRole('admin')
})

// 4. Fetch Data Utama
async function fetchDashboardData() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // A. Ambil Profil User
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    userStats.value = profile || { full_name: 'Learner' }

    // B. Ambil Course yang sedang dipelajari
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            progress_percent,
            courses ( id, title, instructor_name, image_url )
        `)
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false })
        .limit(3) // Cuma ambil 3 terakhir biar gak penuh
    
    if (enrollments) {
      myCourses.value = enrollments
      // Update Statistik Real
      stats.value[0].count = enrollments.length.toString()
    }

    // C. Ambil Jadwal Mentoring (Sebagai Student)
    // Mengambil sesi yang statusnya 'confirmed' dan waktunya belum lewat
    const { data: sessions } = await supabase
        .from('mentoring_sessions')
        .select(`
          *,
          mentors ( name, image_url )
        `)
        .eq('student_id', user.id)
        .eq('status', 'confirmed')
        .gte('scheduled_at', new Date().toISOString()) // Hanya yang akan datang
        .order('scheduled_at', { ascending: true })
        .limit(2)

    if (sessions) upcomingSessions.value = sessions
  }
  loading.value = false
}

// 5. Fetch Data Khusus Admin
const fetchAdminStats = async () => {
  if (hasRole('admin')) {
    const { count, error } = await supabase
      .from('role_applications')
      .select('*', { count: 'exact', head: true }) 
      .eq('status', 'pending')
    
    if (!error) pendingCount.value = count || 0
  }
}

// Helper Date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchDashboardData()
  fetchAdminStats()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Welcome back, {{ userStats?.full_name || 'Learner' }} 👋</h1>
      <p class="text-slate-500 dark:text-slate-400">Here's what's happening with your learning journey.</p>
    </div>

    <div v-if="hasRole('admin')" class="mb-10 animate-fade-in-up">
      <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Admin Control Center</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          @click="router.push('/admin/applications')"
          class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group hover:shadow-md hover:border-[#00d4e3] transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-file-signature"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">Instructor Apps</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Review pending requests.</p>
            </div>
            
            <div v-if="pendingCount > 0" class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
              {{ pendingCount }} Pending
            </div>
            <div v-else class="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
              All Clear
            </div>
          </div>
        </div>

        <div 
          @click="router.push('/admin/users')"
          class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group hover:shadow-md hover:border-purple-400 transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-users-gear"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">User Management</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage roles & users.</p>
            </div>
          </div>
        </div>

        <div 
          @click="router.push('/admin/courses')"
          class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group hover:shadow-md hover:border-orange-400 transition-all relative overflow-hidden"
        >
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-layer-group"></i>
              </div>
              <h3 class="font-bold text-lg text-slate-800 dark:text-white group-hover:text-orange-600 transition-colors">Course Manager</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Moderate content.</p>
            </div>
          </div>
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
      <div v-for="(stat, index) in stats" :key="index" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div class="flex justify-between text-slate-500 dark:text-slate-400 text-sm mb-4">
          <span>{{ stat.title }}</span>
          <i :class="`fa-solid ${stat.icon} text-[#00d4e3]`"></i>
        </div>
        <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">{{ stat.count }}</div>
        <div class="text-xs text-green-500 font-medium">{{ stat.change }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      
      <div class="lg:col-span-2 space-y-4">
        <h2 class="text-lg font-bold text-slate-800 dark:text-white">Active Courses</h2>
        
        <div v-if="loading" class="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center">
            <i class="fa-solid fa-circle-notch fa-spin text-slate-400"></i>
        </div>

        <div v-else-if="myCourses.length === 0" class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center border border-slate-100 dark:border-slate-700">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <i class="fa-solid fa-book-open"></i>
            </div>
            <p class="text-slate-500 dark:text-slate-400 mb-2">You haven't enrolled in any courses yet.</p>
            <button @click="router.push('/courses')" class="text-[#00d4e3] font-bold text-sm hover:underline">Explore Courses</button>
        </div>

        <div v-else v-for="enrollment in myCourses" :key="enrollment.courses.id" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition">
          <div class="flex justify-between mb-2">
            <h3 class="font-bold text-slate-800 dark:text-white line-clamp-1">{{ enrollment.courses.title }}</h3>
            <span class="font-bold text-sm text-[#00d4e3]">{{ enrollment.progress_percent }}%</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <div class="bg-[#1a1b41] dark:bg-[#00d4e3] h-2 rounded-full transition-all duration-1000" :style="`width: ${enrollment.progress_percent}%`"></div>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-500 dark:text-slate-400 text-xs">Instructor: {{ enrollment.courses.instructor_name }}</span>
            <button @click="router.push(`/course/${enrollment.courses.id}`)" class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:text-[#00d4e3] dark:hover:text-[#00d4e3] transition">
              Continue <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4">Upcoming Mentoring</h2>
        
        <div v-if="loading" class="text-center text-slate-400">Loading...</div>

        <div v-else-if="upcomingSessions.length === 0" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
           <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">No upcoming sessions.</p>
           <button @click="router.push('/mentoring')" class="w-full border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700">Find a Mentor</button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="session in upcomingSessions" :key="session.id" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-700">
            <div class="flex gap-3 items-center">
              <img :src="session.mentors?.image_url || 'https://ui-avatars.com/api/?name=Mentor'" class="w-10 h-10 rounded-lg object-cover bg-slate-200">
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ session.mentors?.name }}</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {{ formatDate(session.scheduled_at) }}
                </p>
              </div>
            </div>
            <a :href="session.meeting_link" target="_blank" class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition">
              Join
            </a>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>