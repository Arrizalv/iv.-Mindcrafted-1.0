<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLogin = ref(true) // Toggle antara Login dan Register
const loading = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('') // Khusus Register

const handleAuth = async () => {
  loading.value = true
  
  if (isLogin.value) {
    // --- LOGIKA LOGIN ---
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard') // Sukses login, masuk dashboard
    }

  } else {
    // --- LOGIKA SIGN UP ---
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        // Data ini akan ditangkap oleh Trigger SQL 'handle_new_user' yang kita buat sebelumnya
        data: {
          full_name: fullName.value,
          avatar_url: `https://ui-avatars.com/api/?name=${fullName.value}&background=00d4e3&color=fff`
        }
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Registration successful! Please check your email to confirm.')
      isLogin.value = true // Kembali ke mode login
    }
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[#1a1b41] flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      
      <div class="bg-[#151635] p-8 text-center">
        <RouterLink to="/" class="flex items-center justify-center gap-3 text-2xl font-bold mb-2 text-white hover:text-[#00d4e3] transition-colors cursor-pointer" title="Back to Home">
          <i class="fa-solid fa-shapes text-[#00d4e3] text-3xl group-hover:rotate-12 transition-transform"></i>
          <span>MINDCRAFTED</span>
        </RouterLink>
        <p class="text-slate-400 text-sm">Elevate your skills to the next level</p>
      </div>

      <div class="p-8">
        <h2 class="text-xl font-bold text-slate-800 mb-6 text-center">
          {{ isLogin ? 'Welcome Back!' : 'Create Account' }}
        </h2>

        <form @submit.prevent="handleAuth" class="space-y-4">
          
          <div v-if="!isLogin">
            <label class="block text-xs font-bold text-slate-500 mb-1">FULL NAME</label>
            <input v-model="fullName" type="text" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4e3] text-sm">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">EMAIL ADDRESS</label>
            <input v-model="email" type="email" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4e3] text-sm">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">PASSWORD</label>
            <input v-model="password" type="password" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#00d4e3] text-sm">
          </div>

          <button :disabled="loading" class="w-full bg-[#00d4e3] text-[#1a1b41] font-bold py-3 rounded-lg hover:opacity-90 transition mt-4">
            {{ loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up') }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-500">
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <button @click="isLogin = !isLogin" class="text-[#1a1b41] font-bold hover:underline ml-1">
            {{ isLogin ? 'Sign Up' : 'Sign In' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>