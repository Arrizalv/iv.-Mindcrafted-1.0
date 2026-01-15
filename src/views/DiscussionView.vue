<script setup>
import { ref } from 'vue'

const activeTab = ref('active')
const showRoom = ref(false)
const roomTitle = ref('')

const joinRoom = (title) => {
  roomTitle.value = title
  showRoom.value = true
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Discussion Rooms</h1>
        <p class="text-slate-500">Join live discussions with WebRTC</p>
      </div>
      <button class="bg-[#1a1b41] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90">
        <i class="fa-solid fa-plus"></i> Create Room
      </button>
    </div>

    <div class="flex gap-2 mb-8">
      <button @click="activeTab = 'active'" :class="activeTab === 'active' ? 'bg-[#1a1b41] text-white' : 'bg-white text-slate-500'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all">Active Rooms</button>
      <button @click="activeTab = 'scheduled'" :class="activeTab === 'scheduled' ? 'bg-[#1a1b41] text-white' : 'bg-white text-slate-500'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all">Scheduled</button>
    </div>

    <div v-if="activeTab === 'active'" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#00d4e3]">
        <div class="flex justify-between items-start mb-4">
          <div>
             <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">React Best Practices <i class="fa-solid fa-globe text-slate-400 text-xs"></i></h3>
             <p class="text-sm text-slate-500">Frontend Development</p>
          </div>
          <span class="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">Live</span>
        </div>
        <div class="flex items-center gap-6 text-xs text-slate-500 mb-6">
          <span><i class="fa-solid fa-users mr-1"></i> 18/30</span>
          <span><i class="fa-regular fa-clock mr-1"></i> 30 mins ago</span>
        </div>
        <button @click="joinRoom('React Best Practices')" class="w-full bg-[#1a1b41] text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90"><i class="fa-solid fa-video mr-2"></i> Join Room</button>
      </div>
    </div>

    <div v-if="showRoom" class="fixed inset-0 bg-slate-100 z-[100] flex flex-col">
      <div class="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-video text-[#00d4e3]"></i>
          <div>
            <h2 class="font-bold text-slate-800 text-sm">{{ roomTitle }}</h2>
            <p class="text-xs text-slate-500">Hosted by Sarah Johnson</p>
          </div>
        </div>
        <button @click="showRoom = false" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition">
          <i class="fa-solid fa-phone-slash mr-2"></i> Leave
        </button>
      </div>
      
      <div class="flex-1 p-4 flex flex-col gap-4">
        <div class="flex-1 bg-slate-200 rounded-2xl flex items-center justify-center relative">
           <div class="text-center">
             <div class="w-24 h-24 bg-[#1a1b41] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">SJ</div>
             <h3 class="font-semibold text-slate-700">Sarah Johnson</h3>
             <span class="bg-[#00d4e3] text-white text-[10px] px-2 py-1 rounded-full mt-2 inline-block">Speaking</span>
           </div>
        </div>
        
        <div class="flex justify-center gap-4 mt-2">
           <button class="w-12 h-12 rounded-full bg-[#1a1b41] text-white flex items-center justify-center"><i class="fa-solid fa-microphone"></i></button>
           <button class="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center" @click="showRoom = false"><i class="fa-solid fa-phone"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>