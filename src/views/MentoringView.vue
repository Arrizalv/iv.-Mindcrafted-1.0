<script setup>
// ... (Script SAMA PERSIS kayak sebelumnya, gak usah diubah) ...
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const { userProfile } = useUser()
const activeTab = ref('find')
const loading = ref(true)
const mentors = ref([])
const mySessions = ref([])
const searchQuery = ref('')
const showBookingModal = ref(false)
const selectedMentor = ref(null)
const bookingForm = ref({ topic: '', date: '', time: '' })

const fetchMentors = async () => {
  loading.value = true
  const { data } = await supabase.from('mentors').select('*').eq('is_available', true)
  if (data) mentors.value = data
  loading.value = false
}

const fetchMySessions = async () => {
  if (!userProfile.value) return
  const { data } = await supabase.from('mentoring_sessions')
    .select(`*, mentors ( name, role, image_url )`)
    .eq('student_id', userProfile.value.id)
    .order('scheduled_at', { ascending: true })
  if (data) mySessions.value = data
}

const filteredMentors = computed(() => {
  if (!searchQuery.value) return mentors.value
  return mentors.value.filter(m => m.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const openBooking = (mentor) => { selectedMentor.value = mentor; showBookingModal.value = true }

const submitBooking = async () => {
  if (!userProfile.value) return alert('Please login first')
  const scheduledAt = new Date(`${bookingForm.value.date}T${bookingForm.value.time}`).toISOString()
  const { error } = await supabase.from('mentoring_sessions').insert({
      mentor_id: selectedMentor.value.id, student_id: userProfile.value.id,
      topic: bookingForm.value.topic, scheduled_at: scheduledAt, status: 'pending'
    })
  if (!error) { alert('Request sent!'); showBookingModal.value = false; fetchMySessions(); activeTab.value = 'upcoming' } 
  else { alert(error.message) }
}

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
const formatDate = (dateString) => { return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

onMounted(() => { fetchMentors(); fetchMySessions() })
</script>

<template>
  <div class="relative">
    <div class="mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Mentoring Sessions</h1>
        <p class="text-slate-500 dark:text-slate-400">Connect with industry experts & accelerate your career.</p>
      </div>
      <div class="relative w-full md:w-64" v-if="activeTab === 'find'">
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
      >My Sessions <span v-if="mySessions.length" class="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{{ mySessions.length }}</span></button>
    </div>

    <div v-if="activeTab === 'find'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="loading" v-for="n in 3" :key="n" class="bg-slate-100 dark:bg-slate-800 h-64 rounded-2xl animate-pulse"></div>

      <div v-else v-for="mentor in filteredMentors" :key="mentor.id" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden group border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
        <div class="h-40 relative overflow-hidden bg-slate-200 dark:bg-slate-700">
          <img :src="mentor.image_url || 'https://ui-avatars.com/api/?name='+mentor.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <span class="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Available
          </span>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{{ mentor.name }}</h3>
            <div class="flex items-center gap-1 text-xs font-bold text-amber-500">
              <i class="fa-solid fa-star"></i> {{ mentor.rating }}
            </div>
          </div>
          <p class="text-xs font-medium text-[#00d4e3] uppercase tracking-wide mb-1">{{ mentor.role }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{{ mentor.bio || 'Expert mentor ready to help you.' }}</p>
          
          <div class="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
            <span class="font-bold text-slate-800 dark:text-white text-lg">{{ formatPrice(mentor.hourly_rate) }}<span class="text-xs text-slate-400 font-normal">/hr</span></span>
            <button @click="openBooking(mentor)" class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-900/10">
              Book Session
            </button>
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
          <img :src="session.mentors.image_url" class="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600">
          <div>
            <h3 class="font-bold text-slate-800 dark:text-white">{{ session.mentors.name }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ session.mentors.role }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" 
                :class="{
                  'bg-yellow-100 text-yellow-700': session.status === 'pending',
                  'bg-green-100 text-green-700': session.status === 'confirmed',
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
            <i class="fa-regular fa-calendar mr-2 text-[#00d4e3]"></i> {{ formatDate(session.scheduled_at) }}
          </div>
          
          <a v-if="session.status === 'confirmed' && session.meeting_link" 
             :href="session.meeting_link" target="_blank"
             class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] px-5 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <i class="fa-solid fa-video"></i> Join Call
          </a>
          <button v-else-if="session.status === 'pending'" class="text-xs text-slate-400 cursor-not-allowed">Waiting for confirmation...</button>
        </div>
      </div>
    </div>

    <div v-if="showBookingModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border dark:border-slate-700">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl text-slate-800 dark:text-white">Book Session</h3>
          <button @click="showBookingModal = false" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        
        <div class="mb-6 flex items-center gap-3 bg-slate-50 dark:bg-slate-700 p-3 rounded-xl">
           <img :src="selectedMentor.image_url" class="w-10 h-10 rounded-full">
           <div>
             <p class="text-xs text-slate-500 dark:text-slate-300">Mentor</p>
             <p class="font-bold text-sm text-slate-800 dark:text-white">{{ selectedMentor.name }}</p>
           </div>
           <div class="ml-auto font-bold text-slate-800 dark:text-white">{{ formatPrice(selectedMentor.hourly_rate) }}</div>
        </div>

        <form @submit.prevent="submitBooking" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Select Date</label>
            <input v-model="bookingForm.date" type="date" required class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00d4e3] outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Select Time</label>
            <input v-model="bookingForm.time" type="time" required class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00d4e3] outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Discussion Topic</label>
            <textarea v-model="bookingForm.topic" rows="3" placeholder="What do you want to learn?" required class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#00d4e3] outline-none"></textarea>
          </div>
          
          <button type="submit" class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] py-3 rounded-xl font-bold hover:opacity-90 transition-all mt-2">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  </div>
</template>