<script setup>
import { onMounted, watch, computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useUser } from './composables/useUser' 
import Sidebar from './components/Sidebar.vue'
import { useTheme } from './composables/useTheme'

// 1. Ambil state theme & fungsi toggle
const { isDark, toggleTheme } = useTheme()

// 2. Ambil data user (tambahin userProfile disini biar bisa dipajang di header)
const { fetchUserData, userProfile } = useUser() 

const route = useRoute()

const isFullScreenPage = computed(() => {
  return route.meta.layout === 'landing' || route.meta.layout === 'auth'
})

onMounted(() => { fetchUserData() })
watch(() => route.path, () => { fetchUserData() })
</script>

<template>
  <div v-if="isFullScreenPage" class="w-full min-h-screen bg-white dark:bg-slate-900">
    <RouterView />
  </div>

  <div v-else class="flex min-h-screen bg-[#f5f7fa] font-sans text-slate-800 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
    
    <Sidebar />

    <main class="flex-1 ml-64 p-8">
      
      <header class="flex justify-between items-center mb-8">
        
        <div class="relative w-96 hidden md:block">
           <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
           <input 
             type="text" 
             placeholder="Search..." 
             class="w-full pl-10 pr-4 py-2.5 rounded-full border-none bg-white shadow-sm focus:ring-2 focus:ring-[#00d4e3] outline-none transition-colors dark:bg-slate-800 dark:text-white placeholder:text-slate-400"
           >
        </div>

        <div class="flex items-center gap-4 ml-auto">
          
          <button 
            @click="toggleTheme" 
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm"
            :class="isDark 
              ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'"
            title="Toggle Dark Mode"
          >
            <i class="text-lg" :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
          </button>

          <div class="text-right hidden md:block">
             <p class="text-xs text-slate-500 dark:text-slate-400">Welcome back,</p>
             <p class="font-bold text-slate-800 dark:text-slate-200">{{ userProfile?.full_name || 'User' }}</p>
          </div>

          <img 
            :src="userProfile?.avatar_url || 'https://ui-avatars.com/api/?name=User'" 
            class="w-10 h-10 rounded-full border-2 border-white shadow-sm dark:border-slate-700 bg-slate-200"
          >
        </div>
      </header>

      <RouterView />
      
    </main>
  </div>
</template>