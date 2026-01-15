<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const myCourses = ref([])
const loading = ref(true)

const fetchMyCourses = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Fetch courses dimana instructor_id = user yg login
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (data) myCourses.value = data
  }
  loading.value = false
}

// Mock function create (nanti bisa dibikin page baru)
const createCourse = async () => {
  const title = prompt("Enter Course Title:")
  if (!title) return
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Insert dummy data
  const { error } = await supabase.from('courses').insert({
    title: title,
    instructor_id: user.id,
    description: 'New draft course',
    price: 0,
    is_published: false,
    image_url: 'https://via.placeholder.com/400x250'
  })
  
  if (!error) fetchMyCourses()
  else alert(error.message)
}

onMounted(() => { fetchMyCourses() })
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Instructor Studio</h1>
        <p class="text-slate-500">Manage your courses and curriculum</p>
      </div>
      <button @click="createCourse" class="bg-[#1a1b41] text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> New Course
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#00d4e3]"></i>
    </div>

    <div v-else-if="myCourses.length === 0" class="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-slate-200">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <i class="fa-solid fa-box-open text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-700">No Courses Yet</h3>
      <p class="text-slate-500 text-sm mb-6">Start sharing your knowledge with the world.</p>
      <button @click="createCourse" class="text-[#00d4e3] font-bold hover:underline">Create First Course</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="course in myCourses" :key="course.id" class="bg-white rounded-2xl shadow-sm overflow-hidden group border border-slate-100 relative">
        <div class="h-40 bg-slate-200 relative">
          <img :src="course.image_url" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500">
          <div class="absolute top-3 right-3">
             <span v-if="course.is_published" class="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">PUBLISHED</span>
             <span v-else class="bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded">DRAFT</span>
          </div>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-slate-800 mb-1 line-clamp-1">{{ course.title }}</h3>
          <p class="text-xs text-slate-500 mb-4">{{ course.total_students || 0 }} Students Enrolled</p>
          
          <div class="flex gap-2">
            <button class="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition">
              <i class="fa-solid fa-pen mr-1"></i> Edit
            </button>
            <button class="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition">
              <i class="fa-solid fa-chart-simple mr-1"></i> Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>