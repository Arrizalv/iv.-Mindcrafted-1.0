<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const myCourses = ref([])
const loading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('All') // 'All', 'Published', 'Draft'

// 1. Fetch Data
const fetchMyCourses = async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (data) myCourses.value = data
  }
  loading.value = false
}

// 2. Filter & Search Logic
const filteredCourses = computed(() => {
  return myCourses.value.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    if (filterStatus.value === 'All') return matchSearch
    if (filterStatus.value === 'Published') return matchSearch && course.is_published
    if (filterStatus.value === 'Draft') return matchSearch && !course.is_published
    
    return matchSearch
  })
})

// 3. Create Course (Quick Action)
const createCourse = async () => {
  const title = prompt("Enter Course Title:")
  if (!title) return
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase.from('courses').insert({
    title: title,
    instructor_id: user.id,
    description: 'Draft description...',
    price: 0,
    is_published: false,
    image_url: null
  }).select().single()
  
  if (!error && data) {
    // Langsung redirect ke editor
    router.push({ name: 'edit-course', params: { id: data.id } })
  } else {
    alert(error?.message)
  }
}

// 4. Delete Course
const deleteCourse = async (id) => {
  if(!confirm("Are you sure? This will delete all modules and lessons permanently.")) return

  const { error } = await supabase.from('courses').delete().eq('id', id)
  if(!error) fetchMyCourses()
  else alert("Error deleting: " + error.message)
}

// Helpers
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const estimateEarnings = (price, students) => {
  return formatCurrency(price * (students || 0))
}

onMounted(() => { fetchMyCourses() })
</script>

<template>
  <div class="max-w-7xl mx-auto pb-20">
    
    <div class="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Instructor Dashboard</h1>
        <p class="text-slate-500 mt-1">Manage your content and track your performance.</p>
      </div>
      <button @click="createCourse" class="bg-[#1a1b41] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-[#00d4e3] hover:text-[#1a1b41] transition-all flex items-center gap-2 group">
        <i class="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> 
        Create New Course
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8 flex flex-col md:flex-row gap-4 justify-between">
      
      <div class="relative w-full md:w-96">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search your courses..." 
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#00d4e3] outline-none transition-all dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        >
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm font-bold text-slate-500">Show:</span>
        <select v-model="filterStatus" class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 focus:ring-2 focus:ring-[#00d4e3] outline-none cursor-pointer dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
          <option value="All">All Courses</option>
          <option value="Published">Published</option>
          <option value="Draft">Drafts</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="n in 4" :key="n" class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 h-80 animate-pulse">
        <div class="bg-slate-200 dark:bg-slate-700 h-40 rounded-xl mb-4"></div>
        <div class="bg-slate-200 dark:bg-slate-700 h-6 w-3/4 rounded mb-2"></div>
        <div class="bg-slate-200 dark:bg-slate-700 h-4 w-1/2 rounded"></div>
      </div>
    </div>

    <div v-else-if="filteredCourses.length === 0" class="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
      <div class="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
        <i class="fa-solid fa-layer-group text-3xl"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-700 dark:text-white">No courses found</h3>
      <p class="text-slate-500 text-sm mb-6">You haven't created any courses matching your filters.</p>
      <button v-if="filterStatus !== 'All' || searchQuery" @click="filterStatus = 'All'; searchQuery = ''" class="text-[#00d4e3] font-bold hover:underline">Clear Filters</button>
      <button v-else @click="createCourse" class="text-[#00d4e3] font-bold hover:underline">Create First Course</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id" 
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
      >
        <div class="relative h-44 bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <img v-if="course.image_url" :src="course.image_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div v-else class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-900">
            <i class="fa-solid fa-image text-3xl"></i>
          </div>
          
          <div class="absolute top-3 right-3">
             <span v-if="course.is_published" class="bg-green-500/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm">
               PUBLISHED
             </span>
             <span v-else class="bg-slate-800/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm">
               DRAFT
             </span>
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col">
          <div class="mb-4">
            <h3 class="font-bold text-slate-800 dark:text-white text-lg leading-snug line-clamp-2 mb-1 group-hover:text-[#00d4e3] transition-colors cursor-pointer" @click="router.push({ name: 'edit-course', params: { id: course.id } })">
              {{ course.title }}
            </h3>
            <p class="text-xs text-slate-400 font-medium">Last updated: {{ new Date(course.created_at).toLocaleDateString() }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-bold">Students</p>
              <div class="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                <i class="fa-solid fa-users text-xs text-[#00d4e3]"></i>
                {{ course.total_students || 0 }}
              </div>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-bold">Est. Earnings</p>
              <div class="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                <i class="fa-solid fa-coins text-xs text-amber-400"></i>
                {{ estimateEarnings(course.price, course.total_students) }}
              </div>
            </div>
          </div>

          <div class="mt-auto flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button 
              @click="router.push({ name: 'edit-course', params: { id: course.id } })"
              class="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#00d4e3] hover:text-slate-900 transition flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            
            <button 
              @click="deleteCourse(course.id)"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition border border-slate-200 dark:bg-slate-700 dark:border-slate-600"
              title="Delete Course"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>