<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const courses = ref([])
const loading = ref(true)
const searchQuery = ref('')

// 1. Fetch Semua Kursus (Tanpa Filter Published)
const fetchAllCourses = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    alert("Gagal ambil data: " + error.message)
  } else {
    courses.value = data
  }
  
  loading.value = false
}

// 2. Filter Search
const filteredCourses = computed(() => {
  if (!searchQuery.value) return courses.value
  return courses.value.filter(c => 
    c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    c.instructor_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 3. Logic Delete
const deleteCourse = async (course) => {
  if (!confirm(`⚠️ DANGER: Are you sure you want to permanently delete "${course.title}"? This cannot be undone.`)) return

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', course.id)

  if (error) alert(error.message)
  else {
    alert("Course deleted successfully.")
    fetchAllCourses()
  }
}

// 4. Logic Toggle Publish/Unpublish
const toggleStatus = async (course) => {
  const newStatus = !course.is_published
  const action = newStatus ? "Publish" : "Unpublish" // Buat pesan konfirmasi

  if (!confirm(`${action} this course?`)) return

  const { error } = await supabase
    .from('courses')
    .update({ is_published: newStatus })
    .eq('id', course.id)

  if (error) alert(error.message)
  else fetchAllCourses()
}

// Helper Format Uang
const formatPrice = (price) => {
  return price === 0 ? 'Free' : `$${price}`
}

onMounted(() => { fetchAllCourses() })
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Course Management</h1>
        <p class="text-slate-500">Monitor content quality. Total courses: {{ courses.length }}</p>
      </div>
      
      <div class="relative w-full md:w-72">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search title or instructor..." 
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#00d4e3] focus:ring-2 focus:ring-cyan-100 outline-none text-sm"
        >
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th class="p-5">Course Info</th>
              <th class="p-5">Instructor</th>
              <th class="p-5">Status & Price</th>
              <th class="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            
            <tr v-if="loading">
              <td colspan="4" class="p-8 text-center text-slate-400 italic">Loading courses...</td>
            </tr>

            <tr v-else-if="filteredCourses.length === 0">
              <td colspan="4" class="p-8 text-center text-slate-400">No courses found.</td>
            </tr>

            <tr v-else v-for="course in filteredCourses" :key="course.id" class="hover:bg-slate-50 transition-colors group">
              
              <td class="p-5 max-w-xs">
                <div class="flex items-center gap-3">
                  <img :src="course.image_url" class="w-16 h-10 object-cover rounded bg-slate-200">
                  <div>
                    <h4 class="font-bold text-slate-800 line-clamp-1" :title="course.title">{{ course.title }}</h4>
                    <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{{ course.category }}</span>
                  </div>
                </div>
              </td>

              <td class="p-5">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                    {{ course.instructor_name.charAt(0) }}
                  </div>
                  <span class="text-slate-700 font-medium">{{ course.instructor_name }}</span>
                </div>
              </td>

              <td class="p-5">
                <div class="space-y-1">
                  <div>
                    <span 
                      class="text-[10px] font-bold px-2 py-1 rounded uppercase"
                      :class="course.is_published ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'"
                    >
                      {{ course.is_published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-slate-700">{{ formatPrice(course.price) }}</div>
                </div>
              </td>

              <td class="p-5 text-right">
                <div class="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  
                  <button 
                    @click="router.push(`/course/${course.id}`)"
                    class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center"
                    title="Preview Course"
                  >
                    <i class="fa-solid fa-eye"></i>
                  </button>

                  <button 
                    @click="toggleStatus(course)"
                    class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition flex items-center justify-center"
                    :title="course.is_published ? 'Unpublish (Hide)' : 'Publish (Show)'"
                  >
                    <i :class="course.is_published ? 'fa-solid fa-eye-slash' : 'fa-solid fa-upload'"></i>
                  </button>

                  <button 
                    @click="deleteCourse(course)"
                    class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center"
                    title="Delete Permanently"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>

                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>