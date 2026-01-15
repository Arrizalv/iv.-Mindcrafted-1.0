<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const users = ref([])
const rolesList = ref([])
const loading = ref(true)

// 1. Fetch Users & Roles
const fetchData = async () => {
  loading.value = true
  
  // Ambil data profile + roles mereka
  // Catatan: Query ini agak kompleks di Supabase Client, idealnya pake RPC function
  // Tapi ini cara simpel pake join table
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (
        roles ( id, name )
      )
    `)
  
  if (profiles) {
    // Flatten data biar gampang dibaca UI
    users.value = profiles.map(u => ({
      ...u,
      roles: u.user_roles.map(ur => ur.roles.name)
    }))
  }

  // Ambil list semua role yang tersedia buat dropdown
  const { data: roles } = await supabase.from('roles').select('*')
  rolesList.value = roles
  
  loading.value = false
}

// 2. Logic Add Role (Promote User)
const addRole = async (userId, roleName) => {
  if(!confirm(`Make this user a ${roleName}?`)) return

  // Cari ID role berdasarkan nama
  const roleId = rolesList.value.find(r => r.name === roleName)?.id
  
  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: roleId
  })

  if (error) alert(error.message)
  else fetchData() // Refresh data
}

// 3. Logic Remove Role (Demote User)
const removeRole = async (userId, roleName) => {
  if(!confirm(`Remove ${roleName} access from this user?`)) return

  const roleId = rolesList.value.find(r => r.name === roleName)?.id
  
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)

  if (error) alert(error.message)
  else fetchData()
}

onMounted(() => { fetchData() })
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">User Management</h1>
      <p class="text-slate-500">Control access and roles across the platform</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="p-5 font-bold">User</th>
            <th class="p-5 font-bold">Current Roles</th>
            <th class="p-5 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr v-if="loading">
             <td colspan="3" class="p-5 text-center text-slate-400">Loading users...</td>
          </tr>
          <tr v-else v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition">
            <td class="p-5">
              <div class="flex items-center gap-3">
                <img :src="user.avatar_url" class="w-10 h-10 rounded-full bg-slate-200">
                <div>
                  <h4 class="font-bold text-slate-800">{{ user.full_name }}</h4>
                  <p class="text-xs text-slate-400">ID: {{ user.id.substring(0,8) }}...</p>
                </div>
              </div>
            </td>
            <td class="p-5">
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="role in user.roles" :key="role" 
                  class="px-2.5 py-1 rounded-md text-xs font-bold uppercase"
                  :class="{
                    'bg-slate-200 text-slate-600': role === 'student',
                    'bg-purple-100 text-purple-600': role === 'instructor',
                    'bg-teal-100 text-teal-600': role === 'mentor',
                    'bg-red-100 text-red-600': role === 'admin'
                  }"
                >
                  {{ role }}
                </span>
              </div>
            </td>
            <td class="p-5 text-right">
              <div class="flex justify-end gap-2">
                <button 
                  v-if="!user.roles.includes('instructor')"
                  @click="addRole(user.id, 'instructor')"
                  class="px-3 py-1.5 border border-purple-200 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-50"
                >
                  + Instructor
                </button>
                <button 
                  v-else
                  @click="removeRole(user.id, 'instructor')"
                  class="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50"
                >
                  - Instructor
                </button>

                <button 
                  v-if="!user.roles.includes('mentor')"
                  @click="addRole(user.id, 'mentor')"
                  class="px-3 py-1.5 border border-teal-200 text-teal-600 rounded-lg text-xs font-semibold hover:bg-teal-50"
                >
                  + Mentor
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>