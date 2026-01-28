<script setup>
// ... (Script SAMA, gak usah diubah) ...
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../composables/useUser'

const { userProfile } = useUser()
const loading = ref(true)
const saving = ref(false)
const form = ref({ id: null, name: '', role: '', bio: '', hourly_rate: 0, image_url: '', is_available: true })

const fetchMyProfile = async () => {
  loading.value = true
  if (!userProfile.value) return
  let { data } = await supabase.from('mentors').select('*').eq('user_id', userProfile.value.id).single()
  if (data) { form.value = data } 
  else { form.value.name = userProfile.value.full_name; form.value.image_url = userProfile.value.avatar_url }
  loading.value = false
}

const saveProfile = async () => {
  saving.value = true
  const payload = { user_id: userProfile.value.id, name: form.value.name, role: form.value.role, bio: form.value.bio, hourly_rate: form.value.hourly_rate, image_url: form.value.image_url, is_available: form.value.is_available }
  let error
  if (form.value.id) { const { error: updateErr } = await supabase.from('mentors').update(payload).eq('id', form.value.id); error = updateErr } 
  else { const { error: insertErr } = await supabase.from('mentors').insert(payload); error = insertErr }
  saving.value = false
  if (!error) { alert("Profile updated!"); fetchMyProfile() } else { alert("Failed: " + error.message) }
}
const formattedRate = computed(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(form.value.hourly_rate))
onMounted(() => { fetchMyProfile() })
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Mentor Profile</h1>
      <p class="text-slate-500 dark:text-slate-400">Manage how you appear to potential students.</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">Basic Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
              <input v-model="form.name" type="text" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Professional Title / Role</label>
              <input v-model="form.role" type="text" placeholder="e.g. Senior Product Designer" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Profile Image URL</label>
            <div class="flex gap-2">
              <input v-model="form.image_url" type="text" placeholder="https://..." class="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">Expertise & Rate</h3>
          
          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Hourly Rate (USD)</label>
            <div class="relative w-32">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input v-model="form.hourly_rate" type="number" class="w-full pl-6 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">About Me (Bio)</label>
            <textarea v-model="form.bio" rows="5" placeholder="Tell students about your experience..." class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-[#00d4e3] outline-none leading-relaxed"></textarea>
          </div>

          <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
            <div 
              @click="form.is_available = !form.is_available"
              class="w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300"
              :class="form.is_available ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-500'"
            >
              <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm" :class="form.is_available ? 'left-7' : 'left-1'"></div>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700 dark:text-white">Accepting New Students</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Turn this off if your schedule is full.</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button class="px-6 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">Cancel</button>
          <button 
            @click="saveProfile" 
            :disabled="saving"
            class="px-6 py-2.5 bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] font-bold text-sm rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-900/20 flex items-center gap-2"
          >
            <i v-if="saving" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">Preview Card</h3>
        
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden group border border-slate-100 dark:border-slate-700 sticky top-6">
          <div class="h-48 relative overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img :src="form.image_url || 'https://ui-avatars.com/api/?name=' + form.name" class="w-full h-full object-cover">
            <span v-if="form.is_available" class="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Available
            </span>
          </div>
          <div class="p-5">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{{ form.name || 'Your Name' }}</h3>
              <div class="flex items-center gap-1 text-xs font-bold text-amber-500">
                <i class="fa-solid fa-star"></i> 5.0
              </div>
            </div>
            <p class="text-xs font-medium text-[#00d4e3] uppercase tracking-wide mb-1">{{ form.role || 'Your Role' }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 italic">
              "{{ form.bio || 'Your bio will appear here...' }}"
            </p>
            
            <div class="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
              <span class="font-bold text-slate-800 dark:text-white text-lg">{{ formattedRate }}<span class="text-xs text-slate-400 font-normal">/hr</span></span>
              <button class="bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed">
                Book Session
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>