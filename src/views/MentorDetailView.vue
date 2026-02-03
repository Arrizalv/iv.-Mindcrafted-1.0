<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const route = useRoute()
const router = useRouter()
const { userProfile } = useUser()

const mentor = ref(null)
const loading = ref(true)
const showModal = ref(false)
const isSubmitting = ref(false)

// Form Booking
const bookingForm = ref({
  topic: '',
  duration: 1,
  date: '',
  time: '',
  phone: ''
})

// 1. Fetch Mentor Data
const fetchMentorDetail = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('mentors')
    .select('*, profiles:user_id(full_name, avatar_url)')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    alert("Mentor not found")
    router.push('/mentors')
  } else {
    mentor.value = data
  }
  loading.value = false
}

// 2. Hitung Total Harga Real-time
const totalPrice = computed(() => {
  if (!mentor.value) return 0
  return mentor.value.hourly_rate * bookingForm.value.duration
})

// 3. Submit Booking
const submitBooking = async () => {
  if (!userProfile.value) return alert("Please login first!")
  if (!bookingForm.value.date || !bookingForm.value.time) return alert("Please select date and time.")
  if (!bookingForm.value.phone) return alert("WhatsApp number is required.")

  // Validasi Self-Booking
  if (mentor.value.user_id === userProfile.value.id) return alert("You cannot mentor yourself! 😅")

  isSubmitting.value = true

  // Gabungkan Date & Time jadi Timestamp
  const scheduledAt = new Date(`${bookingForm.value.date}T${bookingForm.value.time}`).toISOString()

  try {
    const { error } = await supabase.from('mentoring_bookings').insert({
      mentor_id: mentor.value.id,
      student_id: userProfile.value.id,
      topic: bookingForm.value.topic,
      duration_hours: bookingForm.value.duration,
      total_price: totalPrice.value,
      booking_date: scheduledAt,
      student_phone: bookingForm.value.phone,
      status: 'pending'
    })

    if (error) throw error

    alert("Booking Request Sent! Wait for mentor confirmation via WhatsApp.")
    showModal.value = false
    // Reset Form
    bookingForm.value = { topic: '', duration: 1, date: '', time: '', phone: '' }

  } catch (err) {
    alert("Booking Failed: " + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

onMounted(() => fetchMentorDetail())
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    
    <div v-if="loading" class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-[#00d4e3]"></i></div>

    <div v-else-if="mentor" class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <div class="md:col-span-1">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden sticky top-24">
          <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <div class="px-6 pb-6 text-center -mt-12">
            <img :src="mentor.image_url || mentor.profiles?.avatar_url" class="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 object-cover mx-auto shadow-md">
            
            <h1 class="text-xl font-bold text-slate-800 dark:text-white mt-3">{{ mentor.name }}</h1>
            <p class="text-sm text-[#00d4e3] font-bold uppercase tracking-wide">{{ mentor.role }}</p>
            
            <div class="mt-4 flex justify-center gap-1 text-amber-400 text-sm">
              <i class="fa-solid fa-star"></i> 5.0 (24 Reviews)
            </div>

            <hr class="my-4 border-slate-100 dark:border-slate-700">

            <div class="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              {{ formatPrice(mentor.hourly_rate) }}<span class="text-xs text-slate-400 font-normal">/hour</span>
            </div>

            <button 
              @click="showModal = true"
              :disabled="!mentor.status || mentor.status !== 'active'"
              class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold py-3 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ mentor.status === 'active' ? 'Book a Session' : 'Unavailable' }}
            </button>
          </div>
        </div>
      </div>

      <div class="md:col-span-2 space-y-6">
        <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-4">About Mentor</h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ mentor.bio }}</p>
        </div>

        <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-4">What to expect</h2>
          <ul class="space-y-3 text-slate-600 dark:text-slate-300">
            <li class="flex items-start gap-3"><i class="fa-solid fa-check-circle text-green-500 mt-1"></i> Personalized career advice</li>
            <li class="flex items-start gap-3"><i class="fa-solid fa-check-circle text-green-500 mt-1"></i> Technical code review & debugging</li>
            <li class="flex items-start gap-3"><i class="fa-solid fa-check-circle text-green-500 mt-1"></i> Industry insights & networking tips</li>
          </ul>
        </div>
      </div>

    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="font-bold text-xl dark:text-white">Book Session</h3>
            <p class="text-xs text-slate-500">with {{ mentor.name }}</p>
          </div>
          <button @click="showModal = false" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div class="space-y-4">
          
          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Topic / Agenda</label>
            <input v-model="bookingForm.topic" type="text" placeholder="e.g. Mock Interview, Code Review" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#00d4e3] outline-none dark:text-white">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Duration</label>
            <div class="flex gap-2">
              <button 
                v-for="h in [1, 2, 3]" :key="h" 
                @click="bookingForm.duration = h"
                class="flex-1 py-2 rounded-lg border text-sm font-bold transition-all"
                :class="bookingForm.duration === h ? 'border-[#00d4e3] bg-cyan-50 text-[#00d4e3] dark:bg-[#00d4e3]/20' : 'border-slate-200 dark:border-slate-700 text-slate-500'"
              >
                {{ h }} Hour{{ h > 1 ? 's' : '' }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Date</label>
              <input v-model="bookingForm.date" type="date" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Time</label>
              <input v-model="bookingForm.time" type="time" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-white">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Your WhatsApp Number</label>
            <div class="relative">
              <i class="fa-brands fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-green-500"></i>
              <input v-model="bookingForm.phone" type="text" placeholder="e.g. 62812345678" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono">
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex justify-between items-center mt-4">
            <span class="text-sm text-blue-800 dark:text-blue-300 font-bold">Total Payment</span>
            <span class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ formatPrice(totalPrice) }}</span>
          </div>

          <button 
            @click="submitBooking" 
            :disabled="isSubmitting"
            class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ isSubmitting ? 'Processing...' : 'Confirm Booking' }}
          </button>

        </div>
      </div>
    </div>

  </div>
</template>