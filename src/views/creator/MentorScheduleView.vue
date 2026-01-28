<script setup>
// ... (Script SAMA, gak usah diubah) ...
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'

const { userProfile } = useUser()
const sessions = ref([])
const isAvailable = ref(true)
const mentorId = ref(null)

const fetchMentorSessions = async () => {
  const { data: mentorData } = await supabase.from('mentors').select('id, is_available').ilike('name', userProfile.value.full_name).single()
  if (mentorData) {
    mentorId.value = mentorData.id
    isAvailable.value = mentorData.is_available
    const { data: sessionData } = await supabase.from('mentoring_sessions')
      .select(`*, profiles:student_id ( full_name, avatar_url )`).eq('mentor_id', mentorId.value).order('scheduled_at', { ascending: true })
    if (sessionData) sessions.value = sessionData
  }
}

const toggleAvailability = async () => {
  if (!mentorId.value) return; isAvailable.value = !isAvailable.value
  await supabase.from('mentors').update({ is_available: isAvailable.value }).eq('id', mentorId.value)
}

const updateSessionStatus = async (sessionId, newStatus) => {
  let updateData = { status: newStatus }
  if (newStatus === 'confirmed') {
    const link = prompt("Enter Meeting Link (Zoom/GMeet):")
    if (!link) return
    updateData.meeting_link = link
  }
  await supabase.from('mentoring_sessions').update(updateData).eq('id', sessionId)
  fetchMentorSessions()
}
const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
onMounted(() => { if(userProfile.value) fetchMentorSessions() })
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <div class="lg:col-span-2 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Your Schedule</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm">Manage upcoming sessions</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span class="text-xs font-bold uppercase" :class="isAvailable ? 'text-green-600' : 'text-slate-400'">
            {{ isAvailable ? 'Online' : 'Offline' }}
          </span>
          <button 
            @click="toggleAvailability"
            class="w-12 h-6 rounded-full relative transition-colors duration-300"
            :class="isAvailable ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'"
          >
            <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm" 
                 :class="isAvailable ? 'left-7' : 'left-1'"></div>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="sessions.length === 0" class="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <p class="text-slate-500 dark:text-slate-400">No sessions scheduled yet.</p>
        </div>

        <div v-for="session in sessions" :key="session.id" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 transition hover:shadow-md">
          
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg overflow-hidden">
               <img v-if="session.profiles?.avatar_url" :src="session.profiles.avatar_url" class="w-full h-full object-cover">
               <span v-else>{{ session.profiles?.full_name?.substring(0,2).toUpperCase() || 'ST' }}</span>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white">{{ session.profiles?.full_name || 'Student' }}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]" :title="session.topic">Topic: {{ session.topic }}</p>
            </div>
          </div>

          <div class="text-center md:text-right">
            <p class="font-bold text-slate-800 dark:text-white text-sm">{{ formatDate(session.scheduled_at) }}</p>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" 
                :class="{
                  'bg-yellow-100 text-yellow-700': session.status === 'pending',
                  'bg-green-100 text-green-700': session.status === 'confirmed',
                  'bg-red-100 text-red-700': session.status === 'cancelled'
                }">
                {{ session.status }}
            </span>
          </div>

          <div class="flex gap-2">
             <template v-if="session.status === 'pending'">
               <button @click="updateSessionStatus(session.id, 'confirmed')" class="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition flex items-center justify-center" title="Accept">
                 <i class="fa-solid fa-check"></i>
               </button>
               <button @click="updateSessionStatus(session.id, 'cancelled')" class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition flex items-center justify-center" title="Reject">
                 <i class="fa-solid fa-xmark"></i>
               </button>
             </template>

             <a v-if="session.status === 'confirmed' && session.meeting_link" :href="session.meeting_link" target="_blank" class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition flex items-center justify-center" title="Join Meeting">
               <i class="fa-solid fa-video"></i>
             </a>
          </div>

        </div>
      </div>
    </div>

    <div>
      <div class="bg-[#1a1b41] dark:bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden dark:border dark:border-slate-700">
        <i class="fa-solid fa-chart-line absolute -right-5 -bottom-5 text-8xl text-white/5"></i>
        <h3 class="font-bold mb-6 relative z-10">Performance</h3>
        <div class="space-y-6 relative z-10">
          <div>
            <p class="text-slate-400 text-xs uppercase font-bold mb-1">Total Sessions</p>
            <p class="text-3xl font-bold">{{ sessions.filter(s => s.status === 'confirmed').length }}</p>
          </div>
          <div>
            <p class="text-slate-400 text-xs uppercase font-bold mb-1">Pending Requests</p>
            <p class="text-3xl font-bold text-[#00d4e3]">{{ sessions.filter(s => s.status === 'pending').length }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 class="font-bold text-slate-800 dark:text-white mb-3 text-sm">Mentoring Tips</h3>
        <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
          <li>Prepare questions before the session.</li>
          <li>Share meeting links 10 mins early.</li>
          <li>Ask for feedback after session.</li>
        </ul>
      </div>
    </div>

  </div>
</template>