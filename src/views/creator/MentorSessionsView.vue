<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'

const { userProfile } = useUser()
const requests = ref([])
const loading = ref(true)

// Fetch Requests
const fetchRequests = async () => {
  loading.value = true
  
  // Cari ID mentor saya dulu berdasarkan user_id
  const { data: mentorData } = await supabase.from('mentors').select('id').eq('user_id', userProfile.value.id).single()
  
  if (mentorData) {
    const { data } = await supabase
      .from('mentoring_bookings')
      .select(`*, profiles:student_id ( full_name, avatar_url )`)
      .eq('mentor_id', mentorData.id)
      .order('created_at', { ascending: false })
    
    requests.value = data || []
  }
  loading.value = false
}

// Logic Accept & Chat
const acceptRequest = async (req) => {
  if (!confirm("Accept booking and open WhatsApp?")) return

  await supabase.from('mentoring_bookings').update({ status: 'accepted' }).eq('id', req.id)
  fetchRequests()

  const date = new Date(req.booking_date).toLocaleString()
  const msg = `Halo ${req.profiles.full_name}, saya menerima request mentoring Anda untuk topik "${req.topic}" pada ${date}.`
  window.open(`https://wa.me/${req.student_phone}?text=${encodeURIComponent(msg)}`, '_blank')
}

const formatPrice = (p) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p)
const formatDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(() => { if (userProfile.value) fetchRequests() })
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Mentoring Sessions</h1>
      <p class="text-slate-500">Manage your upcoming schedule.</p>
    </div>

    <div v-if="loading" class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i></div>
    <div v-else-if="requests.length === 0" class="text-center py-20 text-slate-400">No session requests yet.</div>

    <div v-else class="space-y-4">
      <div v-for="req in requests" :key="req.id" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-6">
        
        <div class="flex gap-4 md:w-1/3">
          <img :src="req.profiles?.avatar_url" class="w-12 h-12 rounded-full object-cover">
          <div>
            <h4 class="font-bold text-slate-800 dark:text-white">{{ req.profiles?.full_name }}</h4>
            <p class="text-xs text-slate-500">{{ req.student_phone }}</p>
            <span class="inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase" 
              :class="req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'">
              {{ req.status }}
            </span>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-[#00d4e3]">{{ req.topic }}</h3>
            <span class="font-bold text-slate-700 dark:text-white">{{ formatPrice(req.total_price) }}</span>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2">
            <i class="fa-regular fa-calendar"></i> {{ formatDate(req.booking_date) }} ({{ req.duration_hours }} hrs)
          </p>

          <div class="flex justify-end gap-2">
            <button v-if="req.status === 'pending'" @click="acceptRequest(req)" class="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:shadow-lg flex items-center gap-2">
              <i class="fa-brands fa-whatsapp"></i> Accept & Chat
            </button>
            <button v-else class="bg-slate-100 dark:bg-slate-700 text-slate-500 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <i class="fa-brands fa-whatsapp"></i> Chat Student
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>