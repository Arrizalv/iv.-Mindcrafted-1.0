<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'

const { hasRole, userProfile } = useUser()
const route = useRoute()
const course = ref(null)
const modules = ref([])
const isEnrolled = ref(false)
const loading = ref(true)
const errorMessage = ref('')

const fetchDetail = async () => {
  loading.value = true
  console.log("Fetching detail for ID:", route.params.id)

  try {
    // 1. Ambil Detail Course
    const { data: cData, error: cError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (cError) throw cError
    if (!cData) throw new Error("Course not found (Data Null)")
    
    course.value = cData
    console.log("Course Data:", cData)

    // 2. Ambil Modules & Lessons
    const { data: mData, error: mError } = await supabase
      .from('modules')
      .select(`*, lessons(*)`)
      .eq('course_id', route.params.id)
      .order('sort_order')

    if (mError) console.error("Module Error:", mError) // Gak throw error biar halaman tetep muncul
    
    if (mData) {
      modules.value = mData.map(m => ({
        ...m,
        lessons: m.lessons ? m.lessons.sort((a,b) => a.sort_order - b.sort_order) : []
      }))
    }

    // 3. Cek Enrollment (Kalo user login)
    if (userProfile.value) {
      const { data: enroll } = await supabase.from('enrollments')
        .select('id')
        .eq('course_id', route.params.id)
        .eq('user_id', userProfile.value.id)
        .single()
      
      if (enroll) isEnrolled.value = true
    }

  } catch (err) {
    console.error("Critical Error:", err)
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

const handleEnroll = async () => {
  if (!userProfile.value) return alert('Please login first!')
  
  const { error } = await supabase.from('enrollments').insert({
    user_id: userProfile.value.id,
    course_id: course.value.id,
    progress_percent: 0
  })

  if (!error) {
    isEnrolled.value = true
    alert("Enrollment Successful! Selamat belajar.")
  } else {
    alert("Gagal enroll: " + error.message)
  }
}

onMounted(() => fetchDetail())
</script>

<template>
  <div class="max-w-6xl mx-auto min-h-screen">
    
    <div v-if="loading" class="text-center py-20">
      <i class="fa-solid fa-circle-notch fa-spin text-4xl text-[#00d4e3]"></i>
      <p class="mt-4 text-slate-500">Loading course content...</p>
    </div>

    <div v-else-if="errorMessage" class="text-center py-20 bg-red-50 rounded-xl m-4">
      <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500"></i>
      <h3 class="text-xl font-bold text-red-700 mt-2">Oops! Something went wrong</h3>
      <p class="text-red-500">{{ errorMessage }}</p>
      <p class="text-sm text-slate-500 mt-2">Check console (F12) for details.</p>
    </div>

    <div v-else-if="course">
      <div class="bg-[#1a1b41] rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row gap-8 items-start mb-10">
        <img :src="course.image_url" class="w-full md:w-1/3 rounded-xl shadow-2xl object-cover aspect-video bg-slate-700">
        <div class="flex-1">
          <span class="bg-[#00d4e3] text-[#1a1b41] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-4 inline-block">{{ course.category }}</span>
          <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ course.title }}</h1>
          <p class="text-slate-300 mb-6 leading-relaxed">{{ course.description }}</p>
          
          <div class="flex items-center gap-6 mb-8">
             <div class="flex items-center gap-2">
               <div class="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center font-bold">I</div>
               <span class="font-bold text-sm">{{ course.instructor_name }}</span>
             </div>
             <div class="flex items-center gap-1 text-yellow-400">
               <i class="fa-solid fa-star"></i> <span class="text-white font-bold">{{ course.rating }}</span>
             </div>
          </div>

          <div class="flex gap-4">
             <button 
               v-if="!isEnrolled"
               @click="handleEnroll"
               class="bg-[#00d4e3] text-[#1a1b41] px-8 py-3 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(0,212,227,0.4)] transition-all"
             >
               {{ course.price === 0 ? 'Enroll for Free' : `Buy for $${course.price}` }}
             </button>
             <button 
               v-else
               class="bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg cursor-default"
             >
               <i class="fa-solid fa-check mr-2"></i> Enrolled
             </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div class="lg:col-span-2">
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Course Curriculum</h2>
          
          <div v-if="modules.length === 0" class="text-slate-500 italic bg-slate-50 p-6 rounded-xl">
             Belum ada materi yang diupload oleh instruktur.
          </div>

          <div v-for="mod in modules" :key="mod.id" class="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="bg-slate-50 dark:bg-slate-700/50 p-4 font-bold text-slate-700 dark:text-slate-200 flex justify-between">
              <span>{{ mod.title }}</span>
              <span class="text-xs text-slate-500">{{ mod.lessons.length }} Lessons</span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-slate-700">
              <div 
                v-for="les in mod.lessons" :key="les.id" 
                class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-[#00d4e3] group-hover:text-[#1a1b41] transition-colors">
                    <i class="fa-solid fa-play text-xs"></i>
                  </div>
                  <span class="text-sm font-medium dark:text-slate-300">{{ les.title }}</span>
                </div>
                
                <div v-if="les.is_free || isEnrolled">
                  <span class="text-[#00d4e3] font-bold text-xs">Watch Now</span>
                </div>
                <div v-else>
                  <i class="fa-solid fa-lock text-slate-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 class="font-bold mb-4 dark:text-white">What you'll learn</h3>
            <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li class="flex gap-2"><i class="fa-solid fa-check text-green-500 mt-1"></i> Master fundamental concepts</li>
              <li class="flex gap-2"><i class="fa-solid fa-check text-green-500 mt-1"></i> Build real-world projects</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>