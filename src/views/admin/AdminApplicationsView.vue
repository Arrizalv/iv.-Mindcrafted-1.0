<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const applications = ref([])
const loading = ref(true)

// Ambil semua lamaran pending
const fetchApplications = async () => {
  loading.value = true
  // Join ke tabel profiles biar tau siapa yg nglamar
  const { data, error } = await supabase
    .from('role_applications')
    .select(`
      *,
      profiles ( full_name, avatar_url, email )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (data) applications.value = data
  loading.value = false
}

// LOGIC APPROVE (KUNCI UTAMA)
const approveUser = async (app) => {
  if(!confirm(`Approve ${app.profiles.full_name} as ${app.requested_role}?`)) return

  try {
    // 1. Cari ID Role di tabel roles
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', app.requested_role)
      .single()
      
    if (!roleData) throw new Error('Role not found')

    // 2. Insert ke user_roles (Promote User)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: app.user_id,
        role_id: roleData.id
      })
    
    if (roleError) throw roleError

    // 3. Update status lamaran jadi 'approved'
    await supabase
      .from('role_applications')
      .update({ status: 'approved' })
      .eq('id', app.id)

    alert('User approved successfully!')
    fetchApplications() // Refresh list

  } catch (err) {
    alert(err.message)
  }
}

// LOGIC REJECT
const rejectUser = async (id) => {
  if(!confirm('Reject this application?')) return
  
  await supabase
    .from('role_applications')
    .update({ status: 'rejected' })
    .eq('id', id)
    
  fetchApplications()
}

onMounted(() => { fetchApplications() })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-800 mb-6">Instructor Applications</h1>

    <div v-if="loading" class="text-center py-10">Loading...</div>
    
    <div v-else-if="applications.length === 0" class="text-center text-slate-500 py-10 bg-white rounded-xl shadow-sm">
      <i class="fa-solid fa-check-circle text-green-500 text-4xl mb-4"></i>
      <p>All clear! No pending applications.</p>
    </div>

    <div v-else class="grid gap-4">
      <div v-for="app in applications" :key="app.id" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
        
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-4">
            <img :src="app.profiles.avatar_url" class="w-12 h-12 rounded-full bg-slate-200">
            <div>
              <h4 class="font-bold text-slate-800">{{ app.profiles.full_name }}</h4>
              <span class="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{{ app.profiles.email }}</span>
            </div>
          </div>
          
          <div class="space-y-2 text-sm text-slate-600">
            <p><strong class="text-slate-800">Applying for:</strong> <span class="uppercase font-bold text-[#00d4e3]">{{ app.requested_role }}</span></p>
            <p><strong class="text-slate-800">Portfolio:</strong> <a :href="app.portfolio_url" target="_blank" class="text-blue-500 hover:underline">{{ app.portfolio_url }}</a></p>
            <p class="bg-slate-50 p-3 rounded-lg italic">"{{ app.bio }}"</p>
          </div>
        </div>

        <div class="flex flex-col justify-center gap-3 min-w-[150px]">
          <button @click="approveUser(app)" class="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition shadow-sm">
            <i class="fa-solid fa-check mr-2"></i> Approve
          </button>
          <button @click="rejectUser(app.id)" class="bg-red-100 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition">
            <i class="fa-solid fa-xmark mr-2"></i> Reject
          </button>
        </div>

      </div>
    </div>
  </div>
</template>