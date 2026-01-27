<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const courses = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('All')
const selectedLevel = ref('All')

// Opsi Filter
const categories = ['All', 'Development', 'Design', 'Business', 'Marketing']
const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']

// 1. Fetch Data (Cuma yang PUBLISHED)
const fetchCourses = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true) // <--- PENTING: Filter kursus yang udah rilis aja
    .order('created_at', { ascending: false })
  
  if (data) courses.value = data
  loading.value = false
}

// 2. Logic Searching & Filtering
const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const matchTitle = course.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'All' || course.category === selectedCategory.value
    const matchLevel = selectedLevel.value === 'All' || course.level === selectedLevel.value
    
    return matchTitle && matchCategory && matchLevel
  })
})

// Helper: Format Harga
const formatCurrency = (price) => {
  if (price === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

// Helper: Format Angka Ribuan (1.2k)
const formatNumber = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

// Navigasi ke Detail
const goToDetail = (id) => {
  router.push(`/course/${id}`)
}

onMounted(() => {
  fetchCourses()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-2">Explore Courses</h1>
      <p class="text-slate-500 dark:text-slate-400">Upgrade skill kamu dengan materi terbaik dari para ahli.</p>
    </div>

    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-20 border border-slate-100 dark:border-slate-700 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
      
      <div class="relative w-full md:w-96">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="What do you want to learn?" 
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00d4e3] focus:border-transparent outline-none transition-all dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        >
      </div>

      <div class="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
        <select v-model="selectedLevel" class="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 focus:ring-2 focus:ring-[#00d4e3] outline-none cursor-pointer dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
          <option v-for="level in levels" :key="level" :value="level">{{ level === 'All' ? 'All Levels' : level }}</option>
        </select>

        <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
           <button 
            v-for="cat in categories" 
            :key="cat"
            @click="selectedCategory = cat"
            class="px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border"
            :class="selectedCategory === cat 
              ? 'bg-[#1a1b41] text-white border-[#1a1b41] shadow-lg shadow-indigo-500/30' 
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 animate-pulse border border-slate-100 dark:border-slate-700">
        <div class="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
        <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
        <div class="flex justify-between mt-auto">
           <div class="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
           <div class="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredCourses.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-box-open text-3xl text-slate-400"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">No courses found</h3>
      <p class="text-slate-500 text-sm">Try changing your search keywords or filters.</p>
      <button @click="selectedCategory = 'All'; searchQuery = ''; selectedLevel = 'All'" class="mt-4 text-[#00d4e3] font-semibold hover:underline">Reset Filter</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id" 
        @click="goToDetail(course.id)"
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
      >
        <div class="relative h-48 overflow-hidden bg-slate-200">
          <img :src="course.image_url" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Course Thumbnail">
          
          <div class="absolute top-3 left-3 flex gap-2">
            <span class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-800 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wide">
              {{ course.category }}
            </span>
          </div>
          <div class="absolute top-3 right-3">
             <span class="bg-[#1a1b41]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
              {{ course.level }}
            </span>
          </div>
        </div>
        
        <div class="p-5 flex flex-col flex-1">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-[#00d4e3] transition-colors">
              {{ course.title }}
            </h3>
          </div>
          
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{{ course.description || 'No description provided.' }}</p>

          <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-1">
               <i class="fa-solid fa-chalkboard-user text-[#00d4e3]"></i>
               <span class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{{ course.instructor_name }}</span>
            </div>
            <div class="flex items-center gap-1">
               <i class="fa-solid fa-star text-amber-400"></i>
               <span class="font-bold text-slate-800 dark:text-white">{{ course.rating }}</span>
            </div>
            <div class="flex items-center gap-1 ml-auto">
               <i class="fa-solid fa-users text-slate-400"></i>
               <span>{{ formatNumber(course.total_students) }}</span>
            </div>
          </div>

          <div class="mt-auto flex justify-between items-center">
            <div>
              <p class="text-[10px] text-slate-400 font-semibold uppercase">Price</p>
              <span class="text-xl font-bold text-[#1a1b41] dark:text-white">{{ formatCurrency(course.price) }}</span>
            </div>
            <button class="bg-[#1a1b41] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/20 hover:bg-[#00d4e3] hover:text-[#1a1b41] transition-all flex items-center gap-2">
              View <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>