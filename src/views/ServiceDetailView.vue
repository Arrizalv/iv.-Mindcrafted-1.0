<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const route = useRoute()
const router = useRouter()
const { userProfile } = useUser()

const service = ref(null)
const loading = ref(true)
const showModal = ref(false)
const orderRequirements = ref('')
const isSubmitting = ref(false)
const clientPhone = ref('')

// 1. Fetch Detail Service
const fetchServiceDetail = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('marketplace_services')
    .select(`
      *,
      profiles:user_id ( full_name, avatar_url, role )
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

// 2. Logic Order (Hire Freelancer)
const submitOrder = async () => {
  if (!userProfile.value) return alert("Please login first!")
  if (!orderRequirements.value) return alert("Please describe your requirements.")
  if (!clientPhone.value) return alert("Please enter your WhatsApp number so the freelancer can contact you.") // <--- VALIDASI

  isSubmitting.value = true

  try {
    const { error } = await supabase.from('service_orders').insert({
      service_id: service.value.id,
      client_id: userProfile.value.id,
      freelancer_id: service.value.user_id,
      requirements: orderRequirements.value,
      price: service.value.price_start,
      status: 'pending',
      client_phone: clientPhone.value // <--- SIMPAN NO WA
    })

    if (error) throw error

    alert("Order Sent! The freelancer will contact you via WhatsApp shortly.")
    showModal.value = false
    orderRequirements.value = ''
    clientPhone.value = '' // Reset
    
  } catch (err) {
    alert("Order Failed: " + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

onMounted(() => fetchServiceDetail())
</script>

<template>
  <div class="max-w-6xl mx-auto py-10 px-4">
    
    <div v-if="loading" class="text-center py-20">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-[#00d4e3]"></i>
    </div>

    <div v-else-if="service" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-8">
        <div class="rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <img :src="service.image_url" class="w-full h-[400px] object-cover">
        </div>

        <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-4">{{ service.title }}</h1>
          
          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            <img :src="service.profiles?.avatar_url" class="w-12 h-12 rounded-full object-cover">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Service by</p>
              <h4 class="font-bold text-slate-800 dark:text-white">{{ service.profiles?.full_name }}</h4>
            </div>
            <div class="ml-auto flex gap-2">
              <span v-for="tag in service.tags" :key="tag" class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                #{{ tag }}
              </span>
            </div>
          </div>

          <h3 class="font-bold text-lg mb-3 dark:text-white">About This Gig</h3>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ service.description }}</p>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 sticky top-24">
          <div class="flex justify-between items-end mb-6">
            <span class="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase">Starting at</span>
            <span class="text-3xl font-bold text-slate-800 dark:text-white">{{ formatPrice(service.price_start) }}</span>
          </div>

          <button 
            @click="showModal = true"
            class="w-full bg-[#00d4e3] text-[#1a1b41] font-bold py-4 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all mb-4"
          >
            Start Project <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>

          <div class="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-clock text-[#00d4e3]"></i> <span>Delivery in 3-5 Days</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-rotate-left text-[#00d4e3]"></i> <span>2 Revisions Included</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-lock text-[#00d4e3]"></i> <span>Secure Payment via Web3</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-xl dark:text-white">Start Project</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4">
          <img :src="service.image_url" class="w-12 h-12 rounded-lg object-cover">
          <div>
            <h4 class="font-bold text-sm dark:text-white line-clamp-1">{{ service.title }}</h4>
            <p class="text-xs text-[#00d4e3] font-bold">{{ formatPrice(service.price_start) }}</p>
          </div>
        </div>

        <div class="space-y-4 mb-6">
      
      <div>
        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Describe requirements</label>
        <textarea 
          v-model="orderRequirements"
          rows="3" 
          placeholder="Hi, I need a website..." 
          class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#00d4e3] outline-none dark:text-white"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your WhatsApp Number</label>
        <div class="relative">
            <i class="fa-brands fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
            <input 
              v-model="clientPhone"
              type="text" 
              placeholder="e.g. 628123456789" 
              class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono"
            >
        </div>
        <p class="text-[10px] text-slate-400 mt-1">Format: Country code first (e.g. 62 for Indonesia). No '+' or spaces.</p>
      </div>

  </div>

  <button 
    @click="submitOrder" 
    :disabled="isSubmitting"
    class="w-full bg-[#1a1b41] text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2"
  >
    <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
    {{ isSubmitting ? 'Sending...' : 'Send Order Request' }}
  </button>
      </div>
    </div>

  </div>
</template>