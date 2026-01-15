<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const existingApplication = ref(null)

// Form Data
const formData = ref({
  role: 'instructor', // Default
  portfolio: '',
  bio: ''
})

// Cek apakah user udah pernah nglamar
const checkStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('role_applications')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending') // Cek yg masih pending aja
    .single()
  
  if (data) existingApplication.value = data
}

// Submit Lamaran
const submitApplication = async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('role_applications').insert({
    user_id: user.id,
    requested_role: formData.value.role,
    portfolio_url: formData.value.portfolio,
    bio: formData.value.bio
  })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Application submitted! Please wait for admin approval.')
    checkStatus() // Refresh status
  }
  loading.value = false
}

onMounted(() => { checkStatus() })
</script>

<template>
  <div class="max-w-2xl mx-auto py-10">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-800">Join Our Expert Team</h1>
      <p class="text-slate-500">Share your knowledge and earn money by teaching.</p>
    </div>

    <div v-if="existingApplication" class="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i class="fa-solid fa-hourglass-half text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-800 text-lg">Application Under Review</h3>
      <p class="text-slate-600 mt-2">
        You have applied to become a <strong>{{ existingApplication.requested_role }}</strong>. 
        <br>We will review your portfolio and get back to you soon.
      </p>
    </div>

    <div v-else class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <form @submit.prevent="submitApplication" class="space-y-6">
        
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">I want to apply as:</label>
          <div class="flex gap-4">
            <label class="flex-1 cursor-pointer">
              <input type="radio" v-model="formData.role" value="instructor" class="peer hidden">
              <div class="border-2 border-slate-200 peer-checked:border-[#00d4e3] peer-checked:bg-cyan-50 rounded-xl p-4 text-center transition-all">
                <i class="fa-solid fa-chalkboard-user text-xl mb-2 block"></i>
                <span class="font-bold">Instructor</span>
                <p class="text-xs text-slate-500 mt-1">Create courses & curriculum</p>
              </div>
            </label>
            <label class="flex-1 cursor-pointer">
              <input type="radio" v-model="formData.role" value="mentor" class="peer hidden">
              <div class="border-2 border-slate-200 peer-checked:border-[#00d4e3] peer-checked:bg-cyan-50 rounded-xl p-4 text-center transition-all">
                <i class="fa-solid fa-video text-xl mb-2 block"></i>
                <span class="font-bold">Mentor</span>
                <p class="text-xs text-slate-500 mt-1">Live 1-on-1 sessions</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Portfolio / LinkedIn URL</label>
          <input v-model="formData.portfolio" type="url" required placeholder="https://linkedin.com/in/..." class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00d4e3] outline-none">
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Why should we accept you?</label>
          <textarea v-model="formData.bio" required rows="4" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#00d4e3] outline-none" placeholder="Tell us about your experience..."></textarea>
        </div>

        <button :disabled="loading" class="w-full bg-[#1a1b41] text-white font-bold py-4 rounded-xl hover:opacity-90 transition">
          {{ loading ? 'Submitting...' : 'Submit Application' }}
        </button>

      </form>
    </div>
  </div>
</template>