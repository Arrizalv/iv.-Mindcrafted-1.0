<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'
import ImageUploader from '../../components/ImageUploader.vue'

const { userProfile } = useUser()
const services = ref([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)

// State Form
const form = ref({
  id: null,
  title: '',
  category: 'Development',
  price_start: 0,
  image_url: '',
  description: '',
  tags: '', 
  status: 'active'
})

const categories = ['Development', 'Design', 'Marketing', 'Data Science', 'Writing', 'Video Editing']

// 1. Fetch Jasa Saya
const fetchMyServices = async () => {
  loading.value = true
  const { data } = await supabase
    .from('marketplace_services')
    .select('*')
    .eq('user_id', userProfile.value.id)
    .order('created_at', { ascending: false })
  
  if (data) services.value = data
  loading.value = false
}

// 2. Open Modal (Add/Edit)
const openModal = (service = null) => {
  if (service) {
    isEditing.value = true
    form.value = { ...service, tags: service.tags ? service.tags.join(', ') : '' }
  } else {
    isEditing.value = false
    form.value = { id: null, title: '', category: 'Development', price_start: 0, image_url: '', description: '', tags: '', status: 'active' }
  }
  showModal.value = true
}

// 3. Save Service
const saveService = async () => {
  const payload = {
    user_id: userProfile.value.id,
    title: form.value.title,
    category: form.value.category,
    price_start: form.value.price_start,
    image_url: form.value.image_url,
    description: form.value.description,
    provider_name: userProfile.value.full_name,
    tags: form.value.tags.split(',').map(t => t.trim()).filter(t => t), 
    status: form.value.status
  }

  let error
  if (isEditing.value) {
    const { error: err } = await supabase.from('marketplace_services').update(payload).eq('id', form.value.id)
    error = err
  } else {
    const { error: err } = await supabase.from('marketplace_services').insert(payload)
    error = err
  }

  if (!error) {
    alert("Service saved successfully!")
    showModal.value = false
    fetchMyServices()
  } else {
    alert("Error: " + error.message)
  }
}

// 4. Delete Service
const deleteService = async (id) => {
  if (!confirm("Are you sure? This cannot be undone.")) return
  await supabase.from('marketplace_services').delete().eq('id', id)
  fetchMyServices()
}

const formatPrice = (price) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

onMounted(() => { if (userProfile.value) fetchMyServices() })
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Manage Services</h1>
        <p class="text-slate-500 dark:text-slate-400">Create and manage your freelancer Gigs.</p>
      </div>
      <button @click="openModal()" class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> Add Service
      </button>
    </div>

    <div v-if="loading" class="text-center py-12"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i></div>

    <div v-else-if="services.length === 0" class="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
      <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <i class="fa-solid fa-briefcase text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-700 dark:text-white">No Services Yet</h3>
      <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">Start selling your skills today.</p>
      <button @click="openModal()" class="text-[#00d4e3] font-bold hover:underline">Create First Gig</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="service in services" :key="service.id" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden group">
        
        <div class="h-40 relative bg-slate-200 dark:bg-slate-700">
          <img :src="service.image_url" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase" 
            :class="service.status === 'active' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'">
            {{ service.status }}
          </span>
        </div>

        <div class="p-5">
          <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-1 truncate">{{ service.title }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">{{ service.category }}</p>
          
          <div class="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-4">
            <span class="font-bold text-slate-800 dark:text-white">{{ formatPrice(service.price_start) }}</span>
            <div class="flex gap-2">
              <button @click="openModal(service)" class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 flex items-center justify-center">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button @click="deleteService(service.id)" class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl text-slate-800 dark:text-white">{{ isEditing ? 'Edit Service' : 'Create New Service' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <form @submit.prevent="saveService" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Service Title</label>
              <input v-model="form.title" type="text" required placeholder="I will build website..." 
                     class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select v-model="form.category" 
                      class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Starting Price ($)</label>
              <input v-model="form.price_start" type="number" required 
                     class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select v-model="form.status" 
                      class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
                <option value="active">Active (Visible)</option>
                <option value="paused">Paused (Hidden)</option>
              </select>
            </div>
          </div>
          <div>
              <ImageUploader 
                bucket="service-images"
                label="Service Cover Image"
                :default-image="form.image_url"
                @update:url="(url) => form.image_url = url"
              />
            </div>    
          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Image URL</label>
            <input v-model="form.image_url" type="text" placeholder="https://..." 
                   class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tags (Comma separated)</label>
            <input v-model="form.tags" type="text" placeholder="React, Vue, Design..." 
                   class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Description</label>
            <textarea v-model="form.description" rows="4" placeholder="Describe your service in detail..."
                      class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none"></textarea>
          </div>

          <button type="submit" class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] py-3 rounded-xl font-bold hover:opacity-90 transition mt-4">
            Save Service
          </button>
        </form>
      </div>
    </div>
  </div>
</template>