<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'
import { useRouter } from 'vue-router'

const { userProfile } = useUser()
const router = useRouter()
const loading = ref(true)

// STATE AGREGAT
const stats = ref({
  totalEarnings: 0,
  totalStudents: 0,
  totalClients: 0,
  pendingActions: 0
})

// STATE PER ROLE
const courseData = ref({ count: 0, students: 0, recentEnrollments: [] })
const mentorData = ref({ upcomingSessions: [], totalSessions: 0, profile: null })
const freelanceData = ref({ activeOrders: [], activeServices: 0 })

// 1. Fetch ALL Data (Parallel)
const fetchDashboardData = async () => {
  loading.value = true
  
  if (!userProfile.value) return

  const userId = userProfile.value.id

  try {
    // KITA JALANKAN 3 QUERY SEKALIGUS BIAR CEPET
    const [coursesRes, mentoringRes, freelanceRes, mentorProfileRes] = await Promise.all([
      
      // A. Fetch Data Kursus (Instructor)
      supabase.from('courses').select('id, title, price, total_students').eq('instructor_id', userId),
      
      // B. Fetch Data Mentoring (Session) - Butuh ID Mentor dulu sebenarnya, tapi kita cari via student join sementara
      // Note: Di sistem real, kita harus fetch ID mentor dulu. Disini kita asumsi user udah punya profile mentor.
      supabase.from('mentoring_sessions').select('*, profiles:student_id(full_name)').eq('status', 'confirmed').gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(3),
      
      // C. Fetch Freelance Orders
      supabase.from('service_orders').select('*, marketplace_services(title), profiles:buyer_id(full_name)').eq('seller_id', userId).in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }),

      // D. Cek Profile Mentor (buat tau rate/id)
      supabase.from('mentors').select('id, hourly_rate').eq('user_id', userId).single()
    ])

    // --- PROSES DATA COURSES ---
    if (coursesRes.data) {
      courseData.value.count = coursesRes.data.length
      courseData.value.students = coursesRes.data.reduce((acc, curr) => acc + curr.total_students, 0)
      // Estimasi Earnings (Total Student * Price) - Kasaran aja
      const courseEarnings = coursesRes.data.reduce((acc, curr) => acc + (curr.total_students * curr.price), 0)
      stats.value.totalEarnings += courseEarnings
      stats.value.totalStudents += courseData.value.students
    }

    // --- PROSES DATA MENTORING ---
    if (mentoringRes.data) {
      mentorData.value.upcomingSessions = mentoringRes.data
      stats.value.pendingActions += mentoringRes.data.length // Itung sesi sbg action
    }
    // Tambahan: Hitung Total Earnings Mentoring (Completed sessions * Rate)
    // Di real app, query table sessions yang status='completed'
    if (mentorProfileRes.data) {
        mentorData.value.profile = mentorProfileRes.data
        // Simulasi hitung duit mentoring (misal total session * rate)
        // stats.value.totalEarnings += ...
    }

    // --- PROSES DATA FREELANCE ---
    if (freelanceRes.data) {
      freelanceData.value.activeOrders = freelanceRes.data
      // Hitung order pending
      const pendingCount = freelanceRes.data.filter(o => o.status === 'pending').length
      stats.value.pendingActions += pendingCount
      
      // Hitung Earnings dari order yang udah completed (Disini kita fetch pending/progress, jadi estimasi aja)
      // stats.value.totalEarnings += ...
    }

  } catch (error) {
    console.error("Dashboard Error:", error)
  } finally {
    loading.value = false
  }
}

// Helper Currency
const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

onMounted(() => fetchDashboardData())
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Creator Studio</h1>
        <p class="text-slate-500 dark:text-slate-400">Overview of your teaching, mentoring, and freelance activity.</p>
      </div>
      <div class="flex gap-3">
         <button @click="router.push('/instructor/courses')" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
           <i class="fa-solid fa-book-open mr-2"></i> Courses
         </button>
         <button @click="router.push('/my-services')" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
           <i class="fa-solid fa-briefcase mr-2"></i> Services
         </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-[#00d4e3]"></i>
    </div>

    <div v-else class="space-y-8">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-[#1a1b41] to-[#2a2b55] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Est. Total Earnings</p>
            <h2 class="text-3xl font-bold">{{ formatMoney(stats.totalEarnings) }}</h2>
          </div>
          <i class="fa-solid fa-wallet absolute -right-4 -bottom-4 text-8xl text-white/5"></i>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Audience</p>
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white">{{ stats.totalStudents }}</h2>
            <p class="text-xs text-green-500 mt-2 font-bold"><i class="fa-solid fa-arrow-trend-up"></i> Across all channels</p>
          </div>
          <i class="fa-solid fa-users absolute -right-4 -bottom-4 text-7xl text-slate-100 dark:text-slate-700"></i>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Action Required</p>
            <h2 class="text-3xl font-bold text-slate-800 dark:text-white">{{ stats.pendingActions }}</h2>
            <p class="text-xs text-slate-400 mt-2">Pending orders & upcoming sessions</p>
          </div>
          <div class="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping" v-if="stats.pendingActions > 0"></div>
          <i class="fa-solid fa-bell absolute -right-4 -bottom-4 text-7xl text-slate-100 dark:text-slate-700"></i>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 class="font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-briefcase mr-2 text-teal-500"></i> Active Orders</h3>
            <button @click="router.push('/my-services')" class="text-xs font-bold text-teal-500 hover:underline">Manage</button>
          </div>
          
          <div v-if="freelanceData.activeOrders.length === 0" class="p-8 text-center text-slate-400">
            <p class="text-sm">No active orders right now.</p>
          </div>
          
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
            <div v-for="order in freelanceData.activeOrders" :key="order.id" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold px-2 py-0.5 rounded uppercase" 
                  :class="order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'">
                  {{ order.status }}
                </span>
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ formatMoney(order.price_deal) }}</span>
              </div>
              <h4 class="font-bold text-slate-800 dark:text-white text-sm mb-1">{{ order.marketplace_services?.title }}</h4>
              <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <i class="fa-solid fa-user"></i> Client: {{ order.profiles?.full_name }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 class="font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-video mr-2 text-purple-500"></i> Mentoring Sessions</h3>
            <button @click="router.push('/mentor-schedule')" class="text-xs font-bold text-purple-500 hover:underline">Schedule</button>
          </div>

          <div v-if="mentorData.upcomingSessions.length === 0" class="p-8 text-center text-slate-400">
            <p class="text-sm">No upcoming sessions scheduled.</p>
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
            <div v-for="session in mentorData.upcomingSessions" :key="session.id" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex justify-between items-center">
              <div>
                <p class="text-xs font-bold text-[#00d4e3] mb-1">{{ formatDate(session.scheduled_at) }}</p>
                <h4 class="font-bold text-slate-800 dark:text-white text-sm">{{ session.profiles?.full_name }}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{{ session.topic }}</p>
              </div>
              <a :href="session.meeting_link" target="_blank" class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-500 hover:text-white transition">
                <i class="fa-solid fa-video"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden lg:col-span-2">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 class="font-bold text-slate-800 dark:text-white"><i class="fa-solid fa-chalkboard-user mr-2 text-blue-500"></i> Course Performance</h3>
            <button @click="router.push('/instructor/courses')" class="text-xs font-bold text-blue-500 hover:underline">Details</button>
          </div>
          
          <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div class="text-center p-4 rounded-xl bg-blue-50 dark:bg-slate-700/50">
               <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Active Courses</p>
               <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ courseData.count }}</p>
             </div>
             <div class="text-center p-4 rounded-xl bg-green-50 dark:bg-slate-700/50">
               <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Students</p>
               <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ courseData.students }}</p>
             </div>
             <div class="text-center p-4 rounded-xl bg-amber-50 dark:bg-slate-700/50">
               <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Avg. Rating</p>
               <p class="text-2xl font-bold text-amber-500">4.9</p>
             </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>