<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const applications = ref([])
const loading = ref(true)

const fetchApplications = async () => {
  loading.value = true
  
  // DEBUGGING: Cek dulu data mentahnya masuk gak
  const { data: rawData, error: rawError } = await supabase
    .from('role_applications')
    .select('*')
  console.log('Semua Data Aplikasi:', rawData) 

  // FETCH UTAMA
  const { data, error } = await supabase
    .from('role_applications')
    .select(`
      *,
      profiles!inner ( full_name, avatar_url, email ) 
    `)
    // Pakai !inner (Inner Join) untuk memastikan hanya mengambil data yang profilenya ada
    // Kalau mau aman pakai left join, hapus "!inner"
    .ilike('status', 'pending') // Ganti .eq jadi .ilike biar Gak Peduli Huruf Besar/Kecil
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching apps:", error.message)
    alert("Gagal ambil data: " + error.message)
  }

  if (data) {
    console.log("Data yang berhasil diambil:", data)
    applications.value = data
  }
  
  loading.value = false
}

// 2. Logic APPROVE (Terima Lamaran)
const approveUser = async (app) => {
  if (!confirm(`Are you sure you want to approve ${app.profiles.full_name} as ${app.requested_role}?`)) return

  try {
    // A. Cari ID Role yang diminta (instructor/mentor)
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', app.requested_role)
      .single()
    
    if (roleError || !roleData) throw new Error('Role not found in database!')

    // B. Masukin User ke Role tersebut (Promote)
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: app.user_id,
        role_id: roleData.id
      })
      // Abaikan kalau user udh punya role itu (biar gak error)
      .select() 

    if (insertError) throw insertError

    // C. Update Status Lamaran jadi 'approved'
    await supabase
      .from('role_applications')
      .update({ status: 'approved' })
      .eq('id', app.id)

    alert(`Success! ${app.profiles.full_name} is now a ${app.requested_role}.`)
    fetchApplications() // Refresh list

  } catch (err) {
    alert('Error: ' + err.message)
  }
}

// 3. Logic REJECT (Tolak Lamaran)
const rejectUser = async (id) => {
  if (!confirm('Reject this application? This action cannot be undone.')) return

  const { error } = await supabase
    .from('role_applications')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) alert(error.message)
  else fetchApplications()
}

onMounted(() => { fetchApplications() })
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Instructor Applications</h1>
      <p class="text-slate-500">Review requests from users who want to join the expert team.</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00d4e3]"></i>
    </div>

    <div v-else-if="applications.length === 0" class="bg-white p-12 rounded-2xl shadow-sm text-center border border-slate-100">
      <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-check text-2xl"></i>
      </div>
      <h3 class="font-bold text-slate-700">All caught up!</h3>
      <p class="text-slate-500 text-sm">No pending applications at the moment.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div v-for="app in applications" :key="app.id" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
        
        <div class="flex-1">
          <div class="flex items-center gap-4 mb-4">
            <img :src="app.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-14 h-14 rounded-full border-2 border-slate-100">
            <div>
              <h4 class="font-bold text-lg text-slate-800">{{ app.profiles?.full_name }}</h4>
              <p class="text-xs text-slate-500">{{ app.profiles?.email }}</p>
              <span class="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-600">
                Applying for: <span class="text-[#00d4e3]">{{ app.requested_role }}</span>
              </span>
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl space-y-3 text-sm">
            <div>
              <strong class="text-slate-700 block text-xs uppercase mb-1">Portfolio / LinkedIn</strong>
              <a :href="app.portfolio_url" target="_blank" class="text-blue-600 font-semibold hover:underline flex items-center gap-2">
                <i class="fa-solid fa-link"></i> {{ app.portfolio_url }}
              </a>
            </div>
            <div>
              <strong class="text-slate-700 block text-xs uppercase mb-1">Motivation / Bio</strong>
              <p class="text-slate-600 italic">"{{ app.bio }}"</p>
            </div>
          </div>
        </div>

        <div class="flex flex-row md:flex-col justify-center gap-3 min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <button 
            @click="approveUser(app)"
            class="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-600 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-check"></i> Approve
          </button>
          
          <button 
            @click="rejectUser(app.id)"
            class="flex-1 bg-white border-2 border-slate-200 text-slate-500 px-4 py-3 rounded-xl font-bold text-sm hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-xmark"></i> Reject
          </button>
        </div>

      </div>
    </div>
  </div>
</template>