<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const user = ref(null)

const form = ref({
  content: '',
  rating: 5,
  role: 'Student', // Misal: Student, Freelancer
  company: 'Mindcrafted' // Misal: Kampus mana, atau Perusahaan mana
})

// Cek Login
onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    alert("Please login first!")
    router.push('/auth')
  } else {
    user.value = data.user
  }
})

// Submit Logic
const submitTestimonial = async () => {
  if (!form.value.content) return alert("Please write something!")
  
  loading.value = true
  
  // Kita insert data. Note: Kita tidak perlu insert nama/avatar manual, 
  // nanti di landing page kita ambil dari tabel profiles via JOIN.
  const { error } = await supabase.from('testimonials').insert({
    user_id: user.value.id,
    content: form.value.content,
    rating: form.value.rating,
    role: form.value.role,
    company: form.value.company,
    // name & avatar_url kita biarkan null atau diisi trigger, 
    // tapi lebih baik nanti di-query lewat relation profiles
  })

  loading.value = false

  if (error) {
    alert("Error: " + error.message)
  } else {
    alert("Thank you! Your story has been submitted for review.")
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
    <div class="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
      
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 text-2xl animate-bounce">
          <i class="fa-solid fa-heart"></i>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Share Your Story</h1>
        <p class="text-slate-500 dark:text-slate-400">How has Mindcrafted helped you?</p>
      </div>

      <form @submit.prevent="submitTestimonial" class="space-y-6">
        
        <div class="flex justify-center gap-2">
          <button 
            type="button" 
            v-for="star in 5" 
            :key="star"
            @click="form.rating = star"
            class="text-2xl transition-transform hover:scale-125 focus:outline-none"
            :class="star <= form.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'"
          >
            <i class="fa-solid fa-star"></i>
          </button>
        </div>
        <p class="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{{ form.rating }} out of 5 Stars</p>

        <div>
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Your Role / Job Title</label>
          <input v-model="form.role" type="text" placeholder="e.g. Frontend Developer" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Company / University</label>
          <input v-model="form.company" type="text" placeholder="e.g. Google or Freelance" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Your Experience</label>
          <textarea v-model="form.content" rows="4" required placeholder="Tell us what you learned..." class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>

        <button :disabled="loading" class="w-full bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
          <i v-if="loading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
          {{ loading ? 'Submitting...' : 'Submit Review' }}
        </button>

        <button type="button" @click="router.back()" class="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Cancel</button>
      </form>

    </div>
  </div>
</template>