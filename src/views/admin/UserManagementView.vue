<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'

const users = ref([])
const rolesList = ref([]) 
const loading = ref(true)
const searchQuery = ref('')

// 1. Fetch Data User & Role Mereka
const fetchUsersAndRoles = async () => {
  loading.value = true
  
  try {
    // A. Ambil Profiles + Roles (Nested Join)
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          roles ( id, name )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error // Lempar error biar ketangkep catch

    if (profilesData) {
      console.log("Data Users Mentah:", profilesData) // Cek di Console Browser

      // B. Ratakan struktur datanya
      users.value = profilesData.map(user => ({
        ...user,
        // Mapping user_roles jadi array string simple
        // Handle kalo user_roles null/undefined
        roles: user.user_roles ? user.user_roles.map(ur => ur.roles?.name).filter(Boolean) : []
      }))
    }

    // C. Ambil daftar Role master
    const { data: allRoles } = await supabase.from('roles').select('*')
    rolesList.value = allRoles

  } catch (err) {
    console.error("Error fetching users:", err.message)
    alert("Gagal ambil data user: " + err.message)
  } finally {
    loading.value = false
  }
}

// 2. Filter Search
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  
  return users.value.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(query)) || 
    (u.email && u.email.toLowerCase().includes(query))
  )
})

// 3. Tambah Role
const addRole = async (user, roleName) => {
  if (!confirm(`Promote ${user.full_name} to ${roleName}?`)) return
  
  const roleId = rolesList.value.find(r => r.name === roleName)?.id
  const { error } = await supabase.from('user_roles').insert({ user_id: user.id, role_id: roleId })

  if (error) alert(error.message)
  else fetchUsersAndRoles()
}

// 4. Hapus Role
const removeRole = async (user, roleName) => {
  if (!confirm(`Remove ${roleName} access from ${user.full_name}?`)) return

  const roleId = rolesList.value.find(r => r.name === roleName)?.id
  
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', user.id)
    .eq('role_id', roleId)

  if (error) alert(error.message)
  else fetchUsersAndRoles()
}

onMounted(() => { fetchUsersAndRoles() })
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">User Management</h1>
        <p class="text-slate-500">Manage access and roles for {{ users.length }} registered users.</p>
      </div>
      
      <div class="relative w-full md:w-64">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search users..." 
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#00d4e3] focus:ring-2 focus:ring-cyan-100 outline-none text-sm"
        >
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th class="p-5">User Profile</th>
              <th class="p-5">Current Roles</th>
              <th class="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            
            <tr v-if="loading">
              <td colspan="3" class="p-8 text-center text-slate-400 italic">Loading user database...</td>
            </tr>

            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="3" class="p-8 text-center text-slate-400">No users found.</td>
            </tr>

            <tr v-else v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50 transition-colors group">
              <td class="p-5">
                <div class="flex items-center gap-3">
                  <img :src="user.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-10 h-10 rounded-full bg-slate-200 object-cover">
                  <div>
                    <h4 class="font-bold text-slate-800">{{ user.full_name }}</h4>
                    <p class="text-xs text-slate-400 font-mono">{{ user.email }}</p>
                    <p class="text-[10px] text-slate-300">ID: {{ user.id.slice(0,8) }}...</p>
                  </div>
                </div>
              </td>

              <td class="p-5">
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="role in user.roles" :key="role" 
                    class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border"
                    :class="{
                      'bg-slate-100 border-slate-200 text-slate-600': role === 'student',
                      'bg-blue-50 border-blue-100 text-blue-600': role === 'instructor',
                      'bg-purple-50 border-purple-100 text-purple-600': role === 'mentor',
                      'bg-red-50 border-red-100 text-red-600': role === 'admin'
                    }"
                  >
                    {{ role }}
                  </span>
                </div>
              </td>

              <td class="p-5 text-right">
                <div class="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  
                  <button 
                    v-if="!user.roles.includes('instructor')"
                    @click="addRole(user, 'instructor')"
                    class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center"
                    title="Promote to Instructor"
                  >
                    <i class="fa-solid fa-chalkboard-user"></i>
                  </button>
                  <button 
                    v-else
                    @click="removeRole(user, 'instructor')"
                    class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-500 transition flex items-center justify-center"
                    title="Remove Instructor"
                  >
                    <i class="fa-solid fa-ban"></i>
                  </button>

                  <button 
                    v-if="!user.roles.includes('mentor')"
                    @click="addRole(user, 'mentor')"
                    class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition flex items-center justify-center"
                    title="Promote to Mentor"
                  >
                    <i class="fa-solid fa-video"></i>
                  </button>
                  <button 
                    v-else
                    @click="removeRole(user, 'mentor')"
                    class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-red-500 hover:text-red-500 transition flex items-center justify-center"
                    title="Remove Mentor"
                  >
                    <i class="fa-solid fa-ban"></i>
                  </button>

                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>