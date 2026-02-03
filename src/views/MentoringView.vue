<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const { userProfile } = useUser()
const router = useRouter()

// STATE
const activeTab = ref('find')
const loading = ref(true)
const mentors = ref([])
const mySessions = ref([])
const searchQuery = ref('')

// 1. Fetch Mentors (Untuk Tab Find)
const fetchMentors = async () => {
  loading.value = true
  
  // Query ini sekarang AMAN setelah kamu jalankan SQL di Tahap 1
  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles:user_id ( full_name, avatar_url, role )
    `)
    .eq('is_available', true) // Hanya yang available
    .order('rating', { ascending: false })

  if (error) console.error("Error fetching mentors:", error)
  else mentors.value = data || []
  
  loading.value = false
}

// 2. Fetch My Sessions (Untuk Tab Upcoming)
const fetchMySessions = async () => {
  if (!userProfile.value) return

  // Kita join ke mentors -> lalu ke profiles (nested join)
  // Perhatikan syntax: mentors ( ..., profiles:user_id(...) )
  const { data, error } = await supabase
    .from('mentoring_bookings') // Pastikan nama tabelnya 'mentoring_bookings' (sesuai tahap sebelumnya)
    .select(`
      *,
      mentors (
        name,
        role,
        image_url,
        profiles:user_id ( full_name, avatar_url )
      )
    `)
    .eq('student_id', userProfile.value.id)
    .order('booking_date', { ascending: true })

  if (error) console.error("Error sessions:", error)
  else mySessions.value = data || []
}

// 3. Search Filter
const filteredMentors = computed(() => {
  if (!searchQuery.value) return mentors.value
  const q = searchQuery.value.toLowerCase()
  return mentors.value.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.role.toLowerCase().includes(q)
  )
})

// 4. Navigasi ke Detail (FITUR BARU)
const viewProfile = (id) => {
  router.push(`/mentor/${id}`)
}

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
const formatDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

onMounted(() => {
  fetchMentors()
  fetchMySessions()
})
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    
    <div class="mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Mentoring Sessions</h1>
        <p class="text-slate-500 dark:text-slate-400">Connect with industry experts & accelerate your career.</p>
      </div>
      
      <div class="relative w-full md:w-80" v-if="activeTab === 'find'">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search mentor or role..." 
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:border-[#00d4e3] focus:ring-2 focus:ring-cyan-100 outline-none text-sm transition-colors"
        >
      </div>
    </div>

    <div class="flex gap-6 mb-8 border-b border-slate-200 dark:border-slate-700">
      <button 
        @click="activeTab = 'find'"
        :class="activeTab === 'find' ? 'border-[#1a1b41] text-[#1a1b41] dark:text-[#00d4e3] dark:border-[#00d4e3]' : 'border-transparent text-slate-500 dark:text-slate-400'"
        class="pb-3 border-b-2 font-bold text-sm transition-all hover:text-[#1a1b41] dark:hover:text-[#00d4e3]"
      >Find a Mentor</button>
      
      <button 
        @click="activeTab = 'upcoming'"
        :class="activeTab === 'upcoming' ? 'border-[#1a1b41] text-[#1a1b41] dark:text-[#00d4e3] dark:border-[#00d4e3]' : 'border-transparent text-slate-500 dark:text-slate-400'"
        class="pb-3 border-b-2 font-bold text-sm transition-all hover:text-[#1a1b41] dark:hover:text-[#00d4e3]"
      >
        My Sessions 
        <span v-if="mySessions.length" class="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{{ mySessions.length }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'find'">
      
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="bg-slate-100 dark:bg-slate-800 h-64 rounded-2xl animate-pulse"></div>
      </div>

      <div v-else-if="filteredMentors.length === 0" class="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <i class="fa-solid fa-user-slash text-4xl text-slate-300 mb-4"></i>
        <p class="text-slate-500 dark:text-slate-400">No mentors found matching your search.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="mentor in filteredMentors" :key="mentor.id" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:border-[#00d4e3]/30 transition-all duration-300 group flex flex-col">
          
          <div class="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 relative">
            <div class="absolute -bottom-8 left-6">
              <img :src="mentor.image_url || mentor.profiles?.avatar_url" class="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 object-cover shadow-md">
              <span class="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
            </div>
          </div>

          <div class="pt-10 px-6 pb-6 flex-1 flex flex-col">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{{ mentor.name }}</h3>
                <p class="text-xs font-bold text-[#00d4e3] uppercase tracking-wide">{{ mentor.role }}</p>
              </div>
              <div class="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                <i class="fa-solid fa-star"></i> {{ mentor.rating || '5.0' }}
              </div>
            </div>

            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed flex-1">
              {{ mentor.bio || 'Professional mentor ready to help.' }}
            </p>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase">Rate</span>
                <span class="text-lg font-bold text-slate-800 dark:text-white">{{ formatPrice(mentor.hourly_rate) }}</span>
              </div>
              
              <button 
                @click="viewProfile(mentor.id)" 
                class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg"
              >
                View Profile
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="activeTab === 'upcoming'" class="space-y-4">
      
      <div v-if="mySessions.length === 0" class="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <p class="text-slate-400">You haven't booked any session yet.</p>
        <button @click="activeTab = 'find'" class="text-[#00d4e3] font-bold text-sm mt-2 hover:underline">Find Mentor</button>
      </div>

      <div v-else v-for="session in mySessions" :key="session.id" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex gap-4 items-center">
          <img :src="session.mentors?.image_url || session.mentors?.profiles?.avatar_url" class="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600">
          <div>
            <h3 class="font-bold text-slate-800 dark:text-white">{{ session.mentors?.name }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ session.mentors?.role }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" 
                :class="{
                  'bg-yellow-100 text-yellow-700': session.status === 'pending',
                  'bg-green-100 text-green-700': session.status === 'accepted',
                  'bg-red-100 text-red-700': session.status === 'cancelled'
                }">
                {{ session.status }}
              </span>
              <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Topic: {{ session.topic }}</span>
            </div>
          </div>
        </div>
        
        <div class="text-right flex flex-col items-end gap-2 w-full md:w-auto">
          <div class="text-sm text-slate-600 dark:text-slate-300 font-medium">
            <i class="fa-regular fa-calendar mr-2 text-[#00d4e3]"></i> {{ formatDate(session.booking_date) }}
          </div>
          
          <button v-if="session.status === 'accepted'" class="bg-green-500 text-white px-5 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
            <i class="fa-brands fa-whatsapp"></i> Chat Mentor
          </button>
          <button v-else-if="session.status === 'pending'" class="text-xs text-slate-400 cursor-not-allowed bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded">Waiting for confirmation...</button>
        </div>
      </div>
    </div>

  </div>
</template>