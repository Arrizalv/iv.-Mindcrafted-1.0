<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const existingApplication = ref(null)

// Form Data
const formData = ref({
  role: 'instructor', // Default selection
  portfolio: '',
  bio: ''
})

// Cek apakah user sudah pernah melamar
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

// Helper untuk menampilkan teks yang rapi
const roleLabel = computed(() => {
  if (!existingApplication.value) return ''
  const role = existingApplication.value.requested_role
  return role.charAt(0).toUpperCase() + role.slice(1)
})

// Submit Lamaran
const submitApplication = async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    alert("Please login first")
    loading.value = false
    return
  }

  const { error } = await supabase.from('role_applications').insert({
    user_id: user.id,
    requested_role: formData.value.role,
    portfolio_url: formData.value.portfolio,
    bio: formData.value.bio
  })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' })
    checkStatus() // Refresh tampilan
  }
  loading.value = false
}

onMounted(() => { checkStatus() })
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4">
    
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-800 dark:text-white">Join Our Expert Ecosystem</h1>
      <p class="text-slate-500 dark:text-slate-400">Teach, mentor, or freelance. Earn money your way.</p>
    </div>

    <div v-if="existingApplication" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center animate-fade-in-up">
      <div class="w-16 h-16 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i class="fa-solid fa-hourglass-half text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-800 dark:text-white text-lg">Application Under Review</h3>
      <p class="text-slate-600 dark:text-slate-300 mt-2 text-sm">
        You have applied to become a <strong>{{ roleLabel }}</strong>. 
        <br>Our team is currently reviewing your portfolio.
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
                <div class="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-chalkboard-user text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Instructor</span>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Create courses & sell curriculum</p>
              </div>
            </label>

            <label class="cursor-pointer group">
              <input type="radio" v-model="formData.role" value="mentor" class="peer hidden">
              <div class="h-full border-2 border-slate-200 dark:border-slate-600 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-500/10 rounded-xl p-4 text-center transition-all hover:border-purple-400">
                <div class="w-12 h-12 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-video text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Mentor</span>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Live 1-on-1 coaching sessions</p>
              </div>
            </label>

            <label class="cursor-pointer group">
              <input type="radio" v-model="formData.role" value="freelancer" class="peer hidden">
              <div class="h-full border-2 border-slate-200 dark:border-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-500/10 rounded-xl p-4 text-center transition-all hover:border-emerald-400">
                <div class="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <i class="fa-solid fa-briefcase text-lg"></i>
                </div>
                <span class="font-bold text-slate-800 dark:text-white block">Freelancer</span>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Offer professional services</p>
              </div>
            </label>

          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Portfolio / LinkedIn URL</label>
            <div class="relative">
              <i class="fa-brands fa-linkedin absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                v-model="formData.portfolio" 
                type="url" 
                required 
                placeholder="https://linkedin.com/in/yourprofile" 
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-[#00d4e3] focus:ring-1 focus:ring-[#00d4e3] outline-none transition"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Why should we accept you?</label>
            <textarea 
              v-model="formData.bio" 
              required 
              rows="4" 
              class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-[#00d4e3] focus:ring-1 focus:ring-[#00d4e3] outline-none transition" 
              placeholder="Tell us about your skills, experience, and what you plan to offer..."
            ></textarea>
          </div>
        </div>

        <button 
          :disabled="loading" 
          class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="loading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
          {{ loading ? 'Submitting Application...' : 'Submit Application' }}
        </button>

      </form>
    </div>
  </div>
</template>