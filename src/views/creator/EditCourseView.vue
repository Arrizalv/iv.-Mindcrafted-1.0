<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import draggable from 'vuedraggable'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const courseId = route.params.id
const course = ref({ title: '', price: 0, is_published: false, description: '', image_url: '' })
const modules = ref([])
const loading = ref(true)

// State untuk Form & Upload
const newModuleTitle = ref('')
const activeModuleId = ref(null) // ID Module yang lagi dibuka form add lesson-nya
const newLessonData = ref({ title: '', video_url: '', is_free: false })
const isUploading = ref(false)
const uploadLabel = ref('Upload Video')

// --- 1. FETCH DATA ---
const fetchCourseData = async () => {
  loading.value = true
  
  // Ambil Course
  const { data: cData } = await supabase.from('courses').select('*').eq('id', courseId).single()
  if (cData) course.value = cData

  // Ambil Modules & Lessons
  const { data: mData } = await supabase
    .from('modules')
    .select(`*, lessons(*)`)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })
  
  if (mData) {
    modules.value = mData.map(m => ({
      ...m,
      lessons: m.lessons ? m.lessons.sort((a,b) => a.sort_order - b.sort_order) : []
    }))
  }
  loading.value = false
}

// --- 2. DRAG & DROP LOGIC (REORDER) ---
const onModuleDrop = async () => {
  const updates = modules.value.map((mod, index) => ({
    id: mod.id,
    sort_order: index,
    updated_at: new Date()
  }))
  await supabase.from('modules').upsert(updates)
}

const onLessonDrop = async (moduleId) => {
  const module = modules.value.find(m => m.id === moduleId)
  if (!module) return

  const updates = module.lessons.map((les, index) => ({
    id: les.id,
    sort_order: index
  }))
  await supabase.from('lessons').upsert(updates)
}

// --- 3. UPLOAD VIDEO LOGIC ---
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploading.value = true
  uploadLabel.value = 'Uploading...'

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${courseId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('course-content')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(filePath)

    newLessonData.value.video_url = publicUrl
    uploadLabel.value = 'Upload Complete!'
  } catch (error) {
    alert('Upload failed: ' + error.message)
    uploadLabel.value = 'Upload Video'
  } finally {
    isUploading.value = false
  }
}

// --- 4. CRUD OPERATIONS ---
const saveSettings = async () => {
  const { error } = await supabase.from('courses').update({
    price: course.value.price,
    is_published: course.value.is_published,
    description: course.value.description, // HTML dari Quill
    image_url: course.value.image_url
  }).eq('id', courseId)
  
  if (!error) alert('Course updated successfully!')
}

const addModule = async () => {
  if (!newModuleTitle.value) return
  await supabase.from('modules').insert({
    course_id: courseId,
    title: newModuleTitle.value,
    sort_order: modules.value.length
  })
  newModuleTitle.value = ''
  fetchCourseData()
}

const addLesson = async (moduleId) => {
  if (!newLessonData.value.title) return

  // Cari module untuk tau urutan terakhir
  const currentModule = modules.value.find(m => m.id === moduleId)
  const nextOrder = currentModule.lessons.length

  await supabase.from('lessons').insert({
    module_id: moduleId,
    title: newLessonData.value.title,
    video_url: newLessonData.value.video_url,
    is_free: newLessonData.value.is_free,
    sort_order: nextOrder
  })

  // Reset Form
  activeModuleId.value = null
  newLessonData.value = { title: '', video_url: '', is_free: false }
  uploadLabel.value = 'Upload Video'
  fetchCourseData()
}

const deleteLesson = async (id) => {
  if(confirm('Are you sure?')) {
    await supabase.from('lessons').delete().eq('id', id)
    fetchCourseData()
  }
}

onMounted(() => fetchCourseData())
</script>

<template>
  <div class="max-w-6xl mx-auto pb-20">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700">
      <div>
        <span class="text-xs font-bold text-[#00d4e3] uppercase tracking-wider">Course Editor</span>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white mt-1">{{ course.title }}</h1>
      </div>
      <div class="flex gap-3">
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg">
           <div class="w-2 h-2 rounded-full" :class="course.is_published ? 'bg-green-500' : 'bg-slate-400'"></div>
           <select v-model="course.is_published" class="bg-transparent text-sm font-bold outline-none text-slate-600 dark:text-slate-300">
             <option :value="false">Draft</option>
             <option :value="true">Published</option>
           </select>
        </div>
        <button @click="saveSettings" class="bg-[#1a1b41] text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2">
          <i class="fa-solid fa-floppy-disk"></i> Save Changes
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-6">
        <h2 class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <i class="fa-solid fa-list-check text-[#00d4e3]"></i> Curriculum
        </h2>

        <draggable 
          v-model="modules" 
          group="modules" 
          item-key="id" 
          handle=".module-drag"
          @end="onModuleDrop"
          class="space-y-6"
        >
          <template #item="{ element: mod }">
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              <div class="bg-slate-50 dark:bg-slate-700/50 p-4 flex justify-between items-center group">
                <div class="flex items-center gap-3">
                  <i class="fa-solid fa-grip-vertical text-slate-300 module-drag cursor-grab hover:text-slate-600"></i>
                  <h3 class="font-bold text-slate-700 dark:text-slate-200">{{ mod.title }}</h3>
                </div>
                <button @click="activeModuleId = activeModuleId === mod.id ? null : mod.id" class="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 transition">
                  <i class="fa-solid fa-plus mr-1"></i> Add Lesson
                </button>
              </div>

              <div class="p-2">
                <draggable 
                  v-model="mod.lessons" 
                  group="lessons" 
                  item-key="id"
                  handle=".lesson-drag"
                  @end="onLessonDrop(mod.id)"
                  class="space-y-2"
                >
                  <template #item="{ element: les }">
                    <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-[#00d4e3] transition group">
                      <div class="flex items-center gap-3">
                        <i class="fa-solid fa-grip-lines text-slate-300 lesson-drag cursor-grab hover:text-slate-600 text-sm"></i>
                        <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                          <i class="fa-solid fa-play text-xs"></i>
                        </div>
                        <span class="text-sm font-medium dark:text-slate-300">{{ les.title }}</span>
                        <span v-if="les.is_free" class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold uppercase">Free</span>
                      </div>
                      <button @click="deleteLesson(les.id)" class="text-slate-300 hover:text-red-500 transition px-2">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </template>
                </draggable>

                <div v-if="activeModuleId === mod.id" class="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <h4 class="text-xs font-bold uppercase text-slate-400 mb-3">New Lesson</h4>
                  
                  <div class="space-y-3">
                    <input v-model="newLessonData.title" placeholder="Lesson Title (e.g. Introduction)" class="w-full p-2.5 text-sm rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
                    
                    <div class="flex items-center gap-2">
                      <input type="file" ref="fileInput" accept="video/*" class="hidden" @change="handleFileUpload">
                      <button 
                        @click="$refs.fileInput.click()" 
                        :disabled="isUploading"
                        class="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition"
                      >
                        <i v-if="isUploading" class="fa-solid fa-circle-notch fa-spin text-[#00d4e3]"></i>
                        <i v-else class="fa-solid fa-cloud-arrow-up text-[#00d4e3]"></i>
                        {{ uploadLabel }}
                      </button>
                      <input v-model="newLessonData.video_url" placeholder="or paste URL..." class="flex-1 p-2.5 text-xs rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" readonly>
                    </div>

                    <div class="flex justify-between items-center pt-2">
                      <label class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input type="checkbox" v-model="newLessonData.is_free" class="rounded text-[#00d4e3] focus:ring-[#00d4e3]">
                        Allow as Free Preview
                      </label>
                      <div class="flex gap-2">
                        <button @click="activeModuleId = null" class="text-xs text-slate-500 font-bold px-3 py-2 hover:bg-slate-200 rounded-lg">Cancel</button>
                        <button @click="addLesson(mod.id)" class="text-xs bg-[#1a1b41] text-white px-4 py-2 rounded-lg font-bold hover:shadow-lg">Save Lesson</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="mod.lessons.length === 0 && activeModuleId !== mod.id" class="text-center py-4 text-slate-400 text-xs italic">
                  No lessons yet. Drag lessons here or click Add Lesson.
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <div class="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
          <input v-model="newModuleTitle" type="text" placeholder="+ New Section Title" class="flex-1 bg-transparent px-4 outline-none text-sm font-bold text-slate-700 dark:text-slate-200" @keyup.enter="addModule">
          <button @click="addModule" class="bg-white dark:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50">Add Section</button>
        </div>
      </div>

      <div class="space-y-6">
        
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold mb-4 dark:text-white text-sm uppercase tracking-wide text-slate-400">Course Thumbnail</h3>
          <div class="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4 relative group">
            <img v-if="course.image_url" :src="course.image_url" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
              <i class="fa-solid fa-image text-4xl"></i>
            </div>
          </div>
          <label class="block">
            <span class="text-xs font-bold text-slate-500 mb-1 block">Image URL</span>
            <input type="text" v-model="course.image_url" class="w-full text-sm p-2.5 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-[#00d4e3]">
          </label>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold mb-4 dark:text-white text-sm uppercase tracking-wide text-slate-400">Pricing ($)</h3>
          <div class="relative">
             <i class="fa-solid fa-dollar-sign absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
             <input v-model="course.price" type="number" class="w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-[#00d4e3] font-bold text-lg text-slate-700">
          </div>
          <p class="text-xs text-slate-500 mt-2 text-center">Set to 0 for Free Course.</p>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold mb-4 dark:text-white text-sm uppercase tracking-wide text-slate-400">About Course</h3>
          <div class="h-64 overflow-y-auto border rounded-lg dark:border-slate-600">
            <QuillEditor theme="snow" v-model:content="course.description" contentType="html" toolbar="minimal" />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style>
/* Custom Style untuk Quill agar sesuai Dark Mode */
.ql-toolbar {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  border-color: #e2e8f0 !important;
}
.ql-container {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-color: #e2e8f0 !important;
  font-family: inherit !important;
}
.dark .ql-toolbar, .dark .ql-container {
  background-color: #0f172a;
  border-color: #334155 !important;
  color: white;
}
.dark .ql-stroke { stroke: #cbd5e1 !important; }
.dark .ql-picker { color: #cbd5e1 !important; }
</style>