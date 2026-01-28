<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router' // Update import ini
import { useUser } from '../composables/useUser'
import { supabase } from '../lib/supabase'
import path from 'path'

const router = useRouter()
const { userProfile, userRoles, currentMode, toggleMode, hasRole } = useUser()

// Cek status expert
const isExpert = computed(() => hasRole('instructor') || hasRole('mentor'))

// Menu buat Student (LEARNER)
const learnerMenu = [
  { path: '/dashboard', name: 'Dashboard', icon: 'fa-grid-2' },
  // 👇 TAMBAHAN BARU DI SINI
  { path: '/roadmap', name: 'AI Roadmap', icon: 'fa-wand-magic-sparkles' }, 
  { path: '/courses', name: 'Explore Courses', icon: 'fa-book-open' },
  { path: '/marketplace', name: 'Marketplace', icon: 'fa-store' },
  { path: '/mentoring', name: 'Find Mentor', icon: 'fa-video' },
  { path: '/community', name: 'Community', icon: 'fa-users' },
]

// Menu buat Creator (Instructor/Mentor)
const creatorMenu = [
  { path: '/creator-dashboard', name: 'Creator Dashboard', icon: 'fa-chart-line' }, // Bisa diarahkan ke dashboard khusus nanti
  { path: '/my-courses', name: 'Manage Courses', icon: 'fa-layer-group' },
  { path: '/mentor-schedule', name: 'My Schedule', icon: 'fa-calendar-check' },
  { path: '/mentor-profile', name: 'My Mentor Profile', icon: 'fa-id-badge' },
  { path: '/my-services', name: 'Manage Services', icon: 'fa-briefcase' },
]

// Tentukan menu mana yang tampil
const currentMenu = computed(() => {
  return currentMode.value === 'learner' ? learnerMenu : creatorMenu
})

// Cek apakah user punya hak akses Creator (Instructor atau Mentor)
const isCreator = computed(() => hasRole('instructor') || hasRole('mentor'))

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}
</script>

<template>
  <aside class="w-64 bg-[#1a1b41] text-white fixed h-full z-50 flex flex-col p-5 shadow-xl">
    
    <div class="flex items-center gap-3 text-xl font-bold mb-8 pl-2">
      <i class="fa-solid fa-shapes text-[#00d4e3] text-2xl"></i>
      <span>MINDCRAFTED</span>
    </div>


    
    <div v-if="isCreator" class="bg-[#151635] p-1 rounded-lg flex text-xs mb-6 mx-2 border border-white/5">
      <button 
        @click="currentMode = 'learner'"
        class="flex-1 py-2 rounded-md transition-all font-semibold"
        :class="currentMode === 'learner' ? 'bg-[#00d4e3] text-[#1a1b41]' : 'text-slate-400 hover:text-white'"
      >
        Learner
      </button>
      <button 
        @click="currentMode = 'creator'"
        class="flex-1 py-2 rounded-md transition-all font-semibold"
        :class="currentMode === 'creator' ? 'bg-[#00d4e3] text-[#1a1b41]' : 'text-slate-400 hover:text-white'"
      >
        Creator
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto">
      <p class="text-[10px] uppercase text-slate-500 font-bold px-4 mb-2 tracking-wider">
        {{ currentMode === 'learner' ? 'Learning Menu' : 'Creator Studio' }}
      </p>
      
      <ul class="space-y-2">
        <li v-for="item in currentMenu" :key="item.path">
          <RouterLink 
            :to="item.path" 
            class="flex items-center gap-4 px-5 py-3 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/10"
            active-class="bg-white/10 text-white font-semibold border-l-4 border-[#00d4e3]"
          >
            <i :class="`fa-solid ${item.icon}`"></i> {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>
    
    <nav class="overflow-y-auto">
   
      <div v-if="!isExpert" class="mt-8 px-5">
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-center relative overflow-hidden group">
          <div class="relative z-10">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
              <i class="fa-solid fa-chalkboard-user"></i>
            </div>
            <h4 class="text-white font-bold text-sm mb-1">Become a Mentor</h4>
            <p class="text-indigo-100 text-[10px] mb-3">Earn from your expertise</p>
            <router-link 
              to="/apply-instructor" 
              class="block w-full bg-white text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition"
            >
              Apply Now
            </router-link>
          </div>
          <div class="absolute top-0 left-0 w-full h-full bg-white/5 group-hover:bg-white/10 transition"></div>
        </div>
      </div>

    </nav>
    
    <div v-if="userProfile" class="mt-auto border-t border-white/10 pt-4 flex items-center gap-3">
      <img :src="userProfile.avatar_url" class="w-10 h-10 rounded-full border-2 border-[#00d4e3]">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold truncate">{{ userProfile.full_name }}</h4>
        <span class="text-[10px] bg-slate-600 px-1.5 py-0.5 rounded text-slate-300 uppercase">
          {{ userRoles.join(', ') || 'Student' }}
        </span>
      </div>
      <button @click="handleLogout" class="text-slate-400 hover:text-red-400 transition">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>

  </aside>
</template>