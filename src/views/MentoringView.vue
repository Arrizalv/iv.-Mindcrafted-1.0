<script setup>
import { ref } from 'vue'

const activeTab = ref('find') // 'find', 'upcoming', 'history'

const mentors = ref([
  { name: 'Dr. Sarah Anderson', role: 'Senior Software Architect', price: '$150/hr', image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' },
  { name: 'Michael Zhang', role: 'Principal UX Designer', price: '$120/hr', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80' }
])
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Mentoring Sessions</h1>
      <p class="text-slate-500">Connect with industry experts</p>
    </div>

    <div class="flex gap-2 mb-8 border-b border-slate-200 pb-1">
      <button 
        @click="activeTab = 'find'"
        :class="activeTab === 'find' ? 'border-[#1a1b41] text-[#1a1b41]' : 'border-transparent text-slate-500'"
        class="px-4 py-2 border-b-2 font-semibold text-sm transition-colors"
      >Find a Mentor</button>
      <button 
        @click="activeTab = 'upcoming'"
        :class="activeTab === 'upcoming' ? 'border-[#1a1b41] text-[#1a1b41]' : 'border-transparent text-slate-500'"
        class="px-4 py-2 border-b-2 font-semibold text-sm transition-colors"
      >My Sessions</button>
    </div>

    <div v-if="activeTab === 'find'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="mentor in mentors" :key="mentor.name" class="bg-white rounded-2xl shadow-sm overflow-hidden group">
        <div class="h-48 relative">
          <img :src="mentor.image" class="w-full h-full object-cover">
          <span class="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">Available</span>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-lg text-slate-800">{{ mentor.name }}</h3>
          <p class="text-sm text-slate-500 mb-3">{{ mentor.role }}</p>
          <div class="flex justify-between items-center pt-3 border-t border-slate-100">
            <span class="font-bold text-slate-800">{{ mentor.price }}</span>
            <button class="bg-[#1a1b41] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90">Book Session</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'upcoming'" class="space-y-6">
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
        <div class="flex justify-between items-start mb-4">
          <div class="flex gap-4">
            <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">SA</div>
            <div>
              <h3 class="font-bold text-slate-800">Dr. Sarah Anderson</h3>
              <p class="text-sm text-slate-500">Scaling Microservices Architecture</p>
            </div>
          </div>
          <span class="bg-[#1a1b41] text-white text-[10px] font-bold px-3 py-1 rounded-full">confirmed</span>
        </div>
        <div class="flex gap-6 text-sm text-slate-600 mb-6">
          <span><i class="fa-regular fa-calendar mr-2"></i> Nov 20, 2025</span>
          <span><i class="fa-solid fa-video mr-2"></i> Video Call</span>
        </div>
        <button class="bg-[#1a1b41] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"><i class="fa-solid fa-video"></i> Join Call</button>
      </div>
    </div>
  </div>
</template>