<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '../../lib/supabase'

// STATE
const activeTab = ref('courses') 
const items = ref([])
const loading = ref(false)
const searchQuery = ref('')

// CONFIG TABS
const tabs = [
  { id: 'courses', label: 'Courses', icon: 'fa-book-open' },
  { id: 'services', label: 'Freelance Gigs', icon: 'fa-briefcase' },
  { id: 'mentors', label: 'Mentors', icon: 'fa-user-tie' },
  { id: 'posts', label: 'Community Posts', icon: 'fa-comments' },
  { id: 'testimonials', label: 'Testimonials', icon: 'fa-star' }
]

// 1. FETCH DATA
const fetchData = async () => {
  loading.value = true
  items.value = [] 

  let query
  
  try {
    if (activeTab.value === 'courses') {
      // Ambil semua kursus (termasuk draft)
      query = supabase.from('courses').select('*').order('created_at', { ascending: false })
    } 
    else if (activeTab.value === 'services') {
      query = supabase.from('marketplace_services').select('*').order('created_at', { ascending: false })
    }
    else if (activeTab.value === 'mentors') {
      query = supabase.from('mentors').select('*').order('id', { ascending: false })
    }
    else if (activeTab.value === 'posts') {
      query = supabase.from('community_posts').select('*, profiles:user_id(full_name, avatar_url)').order('created_at', { ascending: false })
    }
    else if (activeTab.value === 'testimonials') {
      // Join ke profiles agar dapat nama user asli
      query = supabase.from('testimonials').select('*, profiles:user_id(full_name, avatar_url)').order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    items.value = data || []

  } catch (err) {
    alert("Gagal ambil data: " + err.message)
  } finally {
    loading.value = false
  }
}

// 2. SEARCH FILTER
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const q = searchQuery.value.toLowerCase()
  
  return items.value.filter(item => {
    if (activeTab.value === 'courses' || activeTab.value === 'services') return item.title?.toLowerCase().includes(q)
    if (activeTab.value === 'mentors') return item.name?.toLowerCase().includes(q)
    if (activeTab.value === 'posts' || activeTab.value === 'testimonials') return item.content?.toLowerCase().includes(q) || item.profiles?.full_name?.toLowerCase().includes(q)
    return false
  })
})

// 3. DELETE ITEM (Global)
const deleteItem = async (id) => {
  if (!confirm(`⚠️ Yakin ingin menghapus item ini permanen?`)) return

  let table = ''
  if (activeTab.value === 'courses') table = 'courses'
  if (activeTab.value === 'services') table = 'marketplace_services'
  if (activeTab.value === 'mentors') table = 'mentors'
  if (activeTab.value === 'posts') table = 'community_posts'
  if (activeTab.value === 'testimonials') table = 'testimonials'

  const { error } = await supabase.from(table).delete().eq('id', id)

  if (error) alert("Gagal menghapus: " + error.message)
  else items.value = items.value.filter(i => i.id !== id)
}

// 4. TOGGLE STATUS (Hide/Show/Approve)
const toggleStatus = async (item) => {
  let table = ''
  let updateData = {}
  let confirmMsg = ''

  if (activeTab.value === 'courses') {
    table = 'courses'
    const newState = !item.is_published
    updateData = { is_published: newState }
    confirmMsg = newState ? 'Publish Course?' : 'Unpublish Course?'
  }
  else if (activeTab.value === 'services') {
    table = 'marketplace_services'
    const newState = item.status === 'active' ? 'suspended' : 'active'
    updateData = { status: newState }
    confirmMsg = newState === 'active' ? 'Aktifkan Jasa?' : 'Suspend Jasa?'
  }
  else if (activeTab.value === 'mentors') {
    table = 'mentors'
    const currentStatus = item.status || 'active' 
    const newState = currentStatus === 'active' ? 'suspended' : 'active'
    updateData = { status: newState }
    confirmMsg = newState === 'active' ? 'Aktifkan Mentor?' : 'Suspend Mentor?'
  }
  else if (activeTab.value === 'posts') {
    table = 'community_posts'
    const currentStatus = item.status || 'active'
    const newState = currentStatus === 'active' ? 'hidden' : 'active'
    updateData = { status: newState }
    confirmMsg = newState === 'active' ? 'Tampilkan Post?' : 'Sembunyikan Post (Toxic)?'
  }
  else if (activeTab.value === 'testimonials') {
    table = 'testimonials'
    const currentStatus = item.status || 'pending'
    const newState = currentStatus === 'approved' ? 'rejected' : 'approved'
    updateData = { status: newState }
    confirmMsg = newState === 'approved' ? 'Approve & Tampilkan di Web?' : 'Reject & Sembunyikan?'
  }

  if (!confirm(confirmMsg)) return

  const { error } = await supabase.from(table).update(updateData).eq('id', item.id)

  if (error) {
    alert("Gagal update: " + error.message)
  } else {
    // Update State Lokal biar UI langsung berubah
    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) items.value[index] = { ...items.value[index], ...updateData }
  }
}

// Helper: Cek apakah item aktif secara visual
const isItemActive = (item) => {
  if (activeTab.value === 'courses') return item.is_published
  if (activeTab.value === 'testimonials') return item.status === 'approved'
  if (['services', 'mentors'].includes(activeTab.value)) return item.status === 'active'
  if (activeTab.value === 'posts') return (item.status || 'active') === 'active'
  return false
}

watch(activeTab, () => { searchQuery.value = ''; fetchData() })
onMounted(() => fetchData())
</script>

<template>
  <div class="max-w-7xl mx-auto p-6 min-h-screen">
    <div class="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Admin Moderation</h1>
        <p class="text-slate-500 dark:text-slate-400">Atur semua konten website dari sini.</p>
      </div>
      <div class="relative w-full md:w-72">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input v-model="searchQuery" type="text" :placeholder="`Cari di ${activeTab}...`" class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-[#00d4e3] dark:text-white">
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto mb-6 pb-2 border-b border-slate-200 dark:border-slate-700">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" 
        class="flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap" 
        :class="activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-[#00d4e3] border-b-2 border-[#00d4e3]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
        <i :class="`fa-solid ${tab.icon}`"></i> {{ tab.label }}
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[400px]">
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-[#00d4e3]"></i><p>Loading data...</p></div>
      
      <div v-else-if="filteredItems.length === 0" class="flex flex-col items-center justify-center h-64 text-slate-400">
        <i class="fa-solid fa-folder-open text-4xl mb-3 opacity-30"></i><p>Belum ada data di {{ activeTab }}.</p>
      </div>
      
      <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
        <div v-for="item in filteredItems" :key="item.id" class="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex flex-col md:flex-row gap-4 justify-between items-start md:items-center" :class="{'opacity-60 grayscale': !isItemActive(item)}">
          
          <div class="flex gap-4 flex-1 w-full">
            <div class="w-16 h-16 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
              <img v-if="['posts','testimonials'].includes(activeTab)" :src="item.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-full h-full object-cover">
              <img v-else-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover">
              <div v-else class="w-full h-full flex items-center justify-center text-slate-400"><i class="fa-solid fa-image"></i></div>
            </div>

            <div class="flex-1">
              <h4 class="font-bold text-slate-800 dark:text-white line-clamp-1">
                {{ ['courses','services'].includes(activeTab) ? item.title : (activeTab === 'mentors' ? item.name : item.profiles?.full_name) }}
              </h4>
              
              <p v-if="['posts','testimonials'].includes(activeTab)" class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                <span v-if="activeTab==='testimonials'" class="text-amber-500 font-bold mr-1"><i class="fa-solid fa-star"></i> {{item.rating}}</span>
                {{ item.content }}
              </p>
              
              <p v-else class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {{ activeTab === 'courses' ? (item.instructor_name || 'No Instructor') : (activeTab === 'services' ? `Provider: ${item.provider_name}` : item.role) }}
              </p>
              
              <div class="mt-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" 
                  :class="isItemActive(item) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                  {{ isItemActive(item) ? 'Active / Published' : (item.status || 'Hidden/Draft') }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-center">
            <button @click="toggleStatus(item)" class="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition flex items-center justify-center" title="Toggle Status">
              <i :class="isItemActive(item) ? 'fa-solid fa-eye text-green-500' : 'fa-solid fa-eye-slash text-red-500'"></i>
            </button>
            <button @click="deleteItem(item.id)" class="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center" title="Hapus Permanen">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>