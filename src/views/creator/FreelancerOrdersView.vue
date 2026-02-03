<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'

const { userProfile } = useUser()
const orders = ref([])
const loading = ref(true)

// 1. Fetch Orderan Masuk
const fetchIncomingOrders = async () => {
  loading.value = true
  
  // Ambil order di mana freelancer_id = user yang login
  const { data, error } = await supabase
    .from('service_orders')
    .select(`
      *,
      marketplace_services ( title ),
      profiles:client_id ( full_name, avatar_url )
    `)
    .eq('freelancer_id', userProfile.value.id)
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else orders.value = data
  
  loading.value = false
}

// 2. Logic Accept & WhatsApp
const acceptAndChat = async (order) => {
  if (!confirm("Accept this order and open WhatsApp?")) return

  // A. Update status di database jadi 'in_progress'
  const { error } = await supabase
    .from('service_orders')
    .update({ status: 'in_progress' })
    .eq('id', order.id)

  if (error) {
    alert("Error updating status: " + error.message)
    return
  }

  // B. Refresh tampilan
  fetchIncomingOrders()

  // C. Buka WhatsApp
  // Format pesan otomatis
  const message = `Halo ${order.profiles.full_name}, saya menerima order Anda di Mindcrafted untuk jasa "${order.marketplace_services.title}". Bisa kita diskusikan detailnya?`
  const encodedMsg = encodeURIComponent(message)
  
  // Link WA API
  const waLink = `https://wa.me/${order.client_phone}?text=${encodedMsg}`
  
  // Buka di tab baru
  window.open(waLink, '_blank')
}

// Format Harga
const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

// Format Tanggal
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => { if(userProfile.value) fetchIncomingOrders() })
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Incoming Orders</h1>
      <p class="text-slate-500 dark:text-slate-400">Manage your freelance gigs and clients.</p>
    </div>

    <div v-if="loading" class="text-center py-20">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
      <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <i class="fa-solid fa-inbox text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-700 dark:text-white">No Orders Yet</h3>
      <p class="text-slate-500 dark:text-slate-400 text-sm">Promote your gigs to get more clients!</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-6 transition hover:border-[#00d4e3]/50">
        
        <div class="flex items-start gap-4 md:w-1/3">
          <img :src="order.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=Client'" class="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600">
          <div>
            <h4 class="font-bold text-slate-800 dark:text-white">{{ order.profiles?.full_name }}</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Ordered on {{ formatDate(order.created_at) }}</p>
            <div class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300">
              <i class="fa-solid fa-circle text-[6px]" :class="{
                'text-yellow-500': order.status === 'pending',
                'text-blue-500': order.status === 'in_progress',
                'text-green-500': order.status === 'completed'
              }"></i>
              {{ order.status.replace('_', ' ') }}
            </div>
          </div>
        </div>

        <div class="flex-1 border-l border-slate-100 dark:border-slate-700 md:pl-6 pl-0 border-t md:border-t-0 pt-4 md:pt-0">
          <h3 class="text-sm font-bold text-[#00d4e3] uppercase mb-1">Service Ordered</h3>
          <p class="font-bold text-lg text-slate-800 dark:text-white mb-2">{{ order.marketplace_services?.title }}</p>
          
          <div class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700 mb-4">
            "{{ order.requirements }}"
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-slate-800 dark:text-white">{{ formatPrice(order.price) }}</span>
            
            <button 
              v-if="order.status === 'pending'"
              @click="acceptAndChat(order)"
              class="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all"
            >
              <i class="fa-brands fa-whatsapp text-lg"></i> Accept & Chat
            </button>

            <button 
              v-else-if="order.status === 'in_progress'"
              @click="acceptAndChat(order)"
              class="bg-white dark:bg-slate-700 border border-green-500 text-green-600 dark:text-green-400 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
            >
              <i class="fa-brands fa-whatsapp text-lg"></i> Chat Client
            </button>

            <div v-else class="text-green-500 font-bold text-sm flex items-center gap-2">
              <i class="fa-solid fa-check-circle"></i> Order Completed
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>