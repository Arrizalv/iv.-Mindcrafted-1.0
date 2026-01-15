import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// Global State (biar bisa diakses di mana aja)
const userProfile = ref(null)
const userRoles = ref<string[]>([])
const currentMode = ref('learner') // 'learner' | 'creator'

export function useUser() {
  
  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 1. Ambil Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      userProfile.value = profile

      // 2. Ambil Roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

      if (rolesData) {
        userRoles.value = rolesData.map((item: any) => item.roles.name)
      }
    } else {
      userProfile.value = null
      userRoles.value = []
    }
  }

  // Helper function buat ngecek role
  const hasRole = (roleName: string) => userRoles.value.includes(roleName)
  
  // Logic Switch Mode
  const toggleMode = () => {
    if (currentMode.value === 'learner') {
      currentMode.value = 'creator'
    } else {
      currentMode.value = 'learner'
    }
  }

  return {
    userProfile,
    userRoles,
    currentMode,
    fetchUserData,
    hasRole,
    toggleMode
  }
}