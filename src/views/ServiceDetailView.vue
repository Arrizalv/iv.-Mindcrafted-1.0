<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const { userProfile } = useUser()
const route = useRoute()
const router = useRouter()

const service = ref(null)
const loading = ref(true)
const showOrderModal = ref(false)
const orderMessage = ref('')
const submitting = ref(false)

// 1. Fetch Detail Jasa
const fetchServiceDetail = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('marketplace_services')
    .select(`
      *,
      profiles:user_id ( id, full_name, avatar_url, role )
    `)
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    alert("Service not found!")
    router.push('/marketplace')
  } else {
    service.value = data
  }
  loading.value = false
}

// 2. Logic Order / Contact
const submitOrder = async () => {
  if (!userProfile.value) return alert("Please login to hire a freelancer.")
  
  submitting.value = true

  const { error } = await supabase.from('service_orders').insert({
    service_id: service.value.id,
    buyer_id: userProfile.value.id,
    seller_id: service.value.user_id, // ID Freelancer
    price_deal: service.value.price_start,
    requirements: orderMessage.value,
    status: 'pending'
  })

  submitting.value = false

  if (!error) {
    alert("Request sent successfully! The freelancer will contact you shortly.")
    showOrderModal.value = false
    // Nanti bisa redirect ke halaman "My Orders"
  } else {
    alert("Failed to send request: " + error.message)
  }
}

// Helper: Cek apakah user melihat jasanya sendiri (biar gak order diri sendiri)
const isMyService = computed(() => {
  return userProfile.value && service.value && userProfile.value.id === service.value.user_id
})

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

onMounted(() => fetchServiceDetail())
</script>

<template>
  <div class="max-w-6xl mx-auto pb-20">
    
    <div v-if="loading" class="text-center py-20">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-[#00d4e3]"></i>
    </div>

    <div v-else-if="service" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-8">
        <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
          <img :src="service.image_url" class="w-full h-full object-cover">
        </div>

        <div>
          <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <span>Marketplace</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
            <span class="text-[#00d4e3] font-bold">{{ service.category }}</span>
          </div>
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-4">{{ service.title }}</h1>
          
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in (service.tags || [])" :key="tag" class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4">About This Gig</h3>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {{ service.description || 'No description provided.' }}
          </p>
        </div>
      </div>

      <div class="space-y-6">
        
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg sticky top-6">
          <div class="flex justify-between items-center mb-6">
            <span class="text-slate-500 dark:text-slate-400 font-medium">Starting at</span>
            <span class="text-3xl font-bold text-slate-800 dark:text-white">{{ formatPrice(service.price_start) }}</span>
          </div>

          <div v-if="!isMyService">
            <button 
              @click="showOrderModal = true"
              class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] py-3.5 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg shadow-indigo-900/10 mb-3"
            >
              Hire Me
            </button>
            <button class="w-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              Message Seller
            </button>
          </div>
          
          <div v-else class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-xl text-center text-sm font-bold">
            ⚡ This is your own service.
          </div>

          <div class="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Secure Transaction with Mindcrafted</span>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div class="flex items-center gap-4 mb-4">
            <img :src="service.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600">
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white text-lg">{{ service.profiles?.full_name }}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">Freelancer</p>
            </div>
          </div>
          <button class="w-full text-[#00d4e3] font-bold text-sm hover:underline">View Full Profile</button>
        </div>

      </div>
    </div>

    <div v-if="showOrderModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up border dark:border-slate-700">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl text-slate-800 dark:text-white">Start Project</h3>
          <button @click="showOrderModal = false" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div class="mb-6 flex gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
           <img :src="service.image_url" class="w-16 h-12 object-cover rounded-lg">
           <div>
             <p class="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{{ service.title }}</p>
             <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Total: <span class="font-bold text-[#00d4e3]">{{ formatPrice(service.price_start) }}</span></p>
           </div>
        </div>

        <div class="mb-6">
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Describe your requirements</label>
          <textarea 
            v-model="orderMessage" 
            rows="5" 
            class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none"
            placeholder="Hello, I would like to hire you for..."
          ></textarea>
        </div>

        <button 
          @click="submitOrder" 
          :disabled="submitting || !orderMessage"
          class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          <i v-if="submitting" class="fa-solid fa-circle-notch fa-spin"></i>
          {{ submitting ? 'Sending...' : 'Send Request' }}
        </button>
      </div>
    </div>

  </div>
</template>