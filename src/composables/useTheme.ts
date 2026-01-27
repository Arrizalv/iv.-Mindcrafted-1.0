import { ref, onMounted } from 'vue'

const isDark = ref(false)

export function useTheme() {
  
  // Fungsi buat Ganti Mode
  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  // Fungsi buat Nerapin Class ke HTML
  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark') // Simpan ke memory browser
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Cek Settingan Awal Pas Website Dibuka
  onMounted(() => {
    // Cek LocalStorage atau Settingan OS User
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark' || (!savedTheme && userPrefersDark)) {
      isDark.value = true
    } else {
      isDark.value = false
    }
    applyTheme()
  })

  return { isDark, toggleTheme }
}