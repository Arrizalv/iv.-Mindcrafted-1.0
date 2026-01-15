<script setup>
import { onMounted, watch, computed } from 'vue' // Tambahin computed
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useUser } from './composables/useUser' // Import composable tadi
import Sidebar from './components/Sidebar.vue' // Pastiin Sidebar dipisah ya

const route = useRoute()
const { fetchUserData } = useUser()

const isFullScreenPage = computed(() => {
  return route.meta.layout === 'landing' || route.meta.layout === 'auth'
})

// Fetch data pas load & ganti route
onMounted(() => { fetchUserData() })
watch(() => route.path, () => { fetchUserData() })
</script>

<template>
  <div v-if="isFullScreenPage" class="w-full min-h-screen bg-white">
    <RouterView />
  </div>

  <div v-else class="flex min-h-screen bg-[#f5f7fa] font-sans text-slate-800">
    <Sidebar />

    <main class="flex-1 ml-64 p-8">
      <RouterView />
    </main>
  </div>
</template>