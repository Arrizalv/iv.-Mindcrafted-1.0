<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '../lib/supabase'

const services = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('All')
const maxPrice = ref(5000)

const categories = ['All', 'Development', 'Design', 'Marketing', 'Data Science', 'Writing']
let realtimeChannel = null

// 1. Fetch Data Awal (Load pertama kali)
const fetchServices = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('marketplace_services')
    .select(`
      *,
      profiles:user_id ( full_name, avatar_url )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (data) services.value = data
  loading.value = false
}

// 2. Helper: Fetch Single Service (Buat handle Realtime INSERT/UPDATE)
// Kita butuh ini karena Realtime payload ga bawa data join (profiles)
const fetchServiceById = async (id) => {
  const { data } = await supabase
    .from('marketplace_services')
    .select(`*, profiles:user_id ( full_name, avatar_url )`)
    .eq('id', id)
    .single()
  return data
}

// 3. Setup Realtime Listener
const setupRealtime = () => {
  realtimeChannel = supabase
    .channel('public:marketplace_services')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'marketplace_services' },
      async (payload) => {
        console.log('Realtime Event:', payload)

        // HANDLE INSERT (Jasa Baru)
        if (payload.eventType === 'INSERT') {
          // Cek status, cuma masukin kalo active
          if (payload.new.status === 'active') {
            const newService = await fetchServiceById(payload.new.id)
            if (newService) services.value.unshift(newService)
          }
        }

        // HANDLE UPDATE (Jasa Diedit)
        if (payload.eventType === 'UPDATE') {
          // Kalo status berubah jadi paused/hidden, hapus dari list
          if (payload.new.status !== 'active') {
            services.value = services.value.filter(s => s.id !== payload.new.id)
          } else {
            // Update data yang ada
            const updatedService = await fetchServiceById(payload.new.id)
            const index = services.value.findIndex(s => s.id === payload.new.id)
            if (index !== -1 && updatedService) {
              services.value[index] = updatedService
            } else if (updatedService) {
              // Kasus unik: tadinya paused, sekarang di-active-in
              services.value.unshift(updatedService)
            }
          }
        }

        // HANDLE DELETE (Jasa Dihapus)
        if (payload.eventType === 'DELETE') {
          services.value = services.value.filter(s => s.id !== payload.old.id)
        }
      }
    )
    .subscribe()
}

// 4. Filter Logic
const filteredServices = computed(() => {
  return services.value.filter(service => {
    const matchSearch = service.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        (service.provider_name && service.provider_name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchCategory = selectedCategory.value === 'All' || service.category === selectedCategory.value
    const matchPrice = service.price_start <= maxPrice.value
    
    return matchSearch && matchCategory && matchPrice
  })
})

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

onMounted(() => {
  fetchServices()
  setupRealtime() // <--- Jalankan Listener
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel) // <--- Bersihkan Memory
})
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Skill Marketplace</h1>
        <p class="text-slate-500 dark:text-slate-400">Hire expert freelancers for your next project.</p>
      </div>
      <div class="relative w-full md:w-64">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search services..." 
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none transition-colors"
        >
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      
      <div class="w-full lg:w-64 flex-shrink-0 space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-fit sticky top-4">
        <div>
          <h3 class="font-bold text-sm mb-3 text-slate-800 dark:text-white">Categories</h3>
          <div class="space-y-2">
            <label v-for="cat in categories" :key="cat" class="flex items-center gap-2 cursor-pointer group">
              <input type="radio" v-model="selectedCategory" :value="cat" class="accent-[#00d4e3]">
              <span class="text-sm text-slate-600 dark:text-slate-400 group-hover:text-[#00d4e3] transition-colors">{{ cat }}</span>
            </label>
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-sm text-slate-800 dark:text-white">Max Price</h3>
            <span class="text-xs font-bold text-[#00d4e3]">{{ formatPrice(maxPrice) }}</span>
          </div>
          <input type="range" v-model="maxPrice" min="10" max="5000" step="50" class="w-full h-1 bg-slate-200 dark:bg-slate-600 accent-[#00d4e3] rounded-lg cursor-pointer">
          <div class="flex justify-between text-xs text-slate-400 mt-2">
            <span>$10</span><span>$5k+</span>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="n in 4" :key="n" class="bg-slate-100 dark:bg-slate-800 h-64 rounded-2xl animate-pulse"></div>
        </div>

        <div v-else-if="filteredServices.length === 0" class="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div class="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
             <i class="fa-solid fa-ghost text-2xl"></i>
          </div>
          <p class="text-slate-500 dark:text-slate-400">No services found matching your criteria.</p>
          <button @click="selectedCategory = 'All'; searchQuery = ''; maxPrice = 5000" class="text-[#00d4e3] font-bold text-sm mt-2 hover:underline">Reset Filters</button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <TransitionGroup name="list">
            <div v-for="service in filteredServices" :key="service.id" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              
              <div class="h-48 relative overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img :src="service.image_url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-800 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                  {{ service.category }}
                </span>
              </div>

              <div class="p-5 flex flex-col flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <img :src="service.profiles?.avatar_url || 'https://ui-avatars.com/api/?name='+ (service.provider_name || 'User')" class="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600">
                  <span class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{{ service.profiles?.full_name || service.provider_name }}</span>
                </div>

                <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-2 leading-tight line-clamp-2 group-hover:text-[#00d4e3] transition-colors">
                  {{ service.title }}
                </h3>
                
                <div class="flex flex-wrap gap-2 mb-4">
                  <span v-for="(tag, i) in (service.tags || []).slice(0,3)" :key="i" class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    {{ tag }}
                  </span>
                  <span v-if="(service.tags || []).length > 3" class="text-[10px] text-slate-400 px-1">
                    +{{ service.tags.length - 3 }}
                  </span>
                </div>

                <div class="mt-auto flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p class="text-[10px] text-slate-400 uppercase font-bold">Starting at</p>
                    <span class="font-bold text-slate-800 dark:text-white text-lg">{{ formatPrice(service.price_start) }}</span>
                  </div>
                  <button @click="$router.push(`/service/${service.id}`)" class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition shadow-lg shadow-indigo-900/10 dark:shadow-cyan-400/20">
                    View Gig
                  </button>
                </div>
              </div>

            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animasi List Masuk/Keluar */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>