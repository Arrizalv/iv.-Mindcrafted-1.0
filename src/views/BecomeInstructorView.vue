<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const existingApplication = ref(null)
const selectedFile = ref(null) // Menyimpan file mentah
const previewUrl = ref(null) // Preview gambar (opsional)

// Form Data
const formData = ref({
  role: 'instructor',
  bio: ''
})

// Cek status lamaran
const checkStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('role_applications')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()
  
  if (data) existingApplication.value = data
}

const roleLabel = computed(() => {
  if (!existingApplication.value) return ''
  const role = existingApplication.value.requested_role
  return role.charAt(0).toUpperCase() + role.slice(1)
})

// Handle File Select
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validasi Ukuran (Max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("File too large! Max size is 2MB.")
    return
  }

  // Validasi Tipe (Gambar atau PDF)
  if (!file.type.match('image.*') && file.type !== 'application/pdf') {
    alert("Only images (JPG, PNG) or PDF allowed.")
    return
  }

  selectedFile.value = file
  // Buat preview kalau itu gambar
  if (file.type.match('image.*')) {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }
}

// Upload ke Supabase Storage
const uploadFile = async (userId) => {
  if (!selectedFile.value) return null

  const fileExt = selectedFile.value.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage
    .from('application-files')
    .upload(filePath, selectedFile.value)

  if (error) throw error

  // Ambil URL Publik
  const { data } = supabase.storage
    .from('application-files')
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Submit Lamaran
const submitApplication = async () => {
  loading.value = true
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Please login first")

    if (!selectedFile.value) throw new Error("Please upload a portfolio/CV file.")

    // 1. Upload File Dulu
    const publicUrl = await uploadFile(user.id)

    // 2. Simpan Data ke Database (URL masuk ke kolom portfolio_url)
    const { error } = await supabase.from('role_applications').insert({
      user_id: user.id,
      requested_role: formData.value.role,
      portfolio_url: publicUrl, // Link hasil upload
      bio: formData.value.bio
    })

    if (error) throw error

    window.scrollTo({ top: 0, behavior: 'smooth' })
    checkStatus()

  } catch (err) {
    alert('Error: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => { checkStatus() })
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4">
    
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Join Our Expert Ecosystem</h1>
      <p class="text-slate-500 dark:text-slate-400">Teach, mentor, or freelance. Upload your credentials.</p>
    </div>

    <div v-if="existingApplication" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i class="fa-solid fa-hourglass-half text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-800 dark:text-white text-lg">Application Under Review</h3>
      <p class="text-slate-600 dark:text-slate-300 mt-2 text-sm">
        You have applied to become a <strong>{{ roleLabel }}</strong>. 
        <br>
        <a :href="existingApplication.portfolio_url" target="_blank" class="text-blue-500 hover:underline mt-2 inline-block">
          <i class="fa-solid fa-paperclip mr-1"></i> View Submitted Portfolio
        </a>
      </p>
    </div>

    <div v-else class="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <form @submit.prevent="submitApplication" class="space-y-8">
        
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">I want to join as:</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <label class="cursor-pointer group">
              <input type="radio" v-model="formData.role" value="instructor" class="peer hidden">
              <div class="h-full border-2 border-slate-200 dark:border-slate-600 peer-checked:border-[#00d4e3] peer-checked:bg-cyan-50 dark:peer-checked:bg-[#00d4e3]/10 rounded-xl p-4 text-center transition-all hover:border-[#00d4e3]/50">
                <div class="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <i class="fa-solid fa-chalkboard-user text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Instructor</span>
              </div>
            </label>

            <label class="cursor-pointer group">
              <input type="radio" v-model="formData.role" value="mentor" class="peer hidden">
              <div class="h-full border-2 border-slate-200 dark:border-slate-600 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-500/10 rounded-xl p-4 text-center transition-all hover:border-purple-400">
                <div class="w-12 h-12 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                  <i class="fa-solid fa-video text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Mentor</span>
              </div>
            </label>

            <label class="cursor-pointer group">
              <input type="radio" v-model="formData.role" value="freelancer" class="peer hidden">
              <div class="h-full border-2 border-slate-200 dark:border-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-500/10 rounded-xl p-4 text-center transition-all hover:border-emerald-400">
                <div class="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <i class="fa-solid fa-briefcase text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Freelancer</span>
              </div>
            </label>

          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Upload Portfolio / CV / Certificate
            <span class="text-red-500">*</span>
          </label>
          
          <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition relative group">
            <input 
              type="file" 
              @change="handleFileChange" 
              accept="image/*,application/pdf"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
            
            <div v-if="selectedFile" class="flex flex-col items-center">
              <img v-if="previewUrl" :src="previewUrl" class="h-32 object-contain rounded-lg mb-2 border border-slate-200 shadow-sm">
              <i v-else class="fa-solid fa-file-pdf text-4xl text-red-500 mb-2"></i>
              
              <span class="text-sm font-bold text-slate-700 dark:text-white">{{ selectedFile.name }}</span>
              <span class="text-xs text-slate-500">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              <p class="text-xs text-[#00d4e3] mt-2 font-bold">Click to change file</p>
            </div>

            <div v-else class="flex flex-col items-center text-slate-400">
              <i class="fa-solid fa-cloud-arrow-up text-3xl mb-2"></i>
              <p class="text-sm font-medium">Drag & drop or click to upload</p>
              <p class="text-xs mt-1">PDF, JPG, PNG (Max 2MB)</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Why should we accept you?</label>
          <textarea 
            v-model="formData.bio" 
            required 
            rows="4" 
            class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-[#00d4e3] focus:ring-1 focus:ring-[#00d4e3] outline-none transition" 
            placeholder="Tell us about your experience..."
          ></textarea>
        </div>

        <button 
          :disabled="loading" 
          class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="loading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
          {{ loading ? 'Uploading & Submitting...' : 'Submit Application' }}
        </button>

      </form>
    </div>
  </div>
</template>