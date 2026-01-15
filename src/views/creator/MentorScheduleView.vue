<script setup>
import { ref } from 'vue'

// Dummy Data (Nanti diganti fetch Supabase table 'mentoring_sessions')
const upcomingSessions = ref([
  { id: 1, student: 'Budi Santoso', topic: 'React Performance', time: '14:00 - 15:00', date: 'Today' },
  { id: 2, student: 'Siti Aminah', topic: 'UI Design Review', time: '10:00 - 11:00', date: 'Tomorrow' },
])

const availability = ref([
  { day: 'Mon', active: true, hours: '09:00 - 17:00' },
  { day: 'Tue', active: true, hours: '09:00 - 17:00' },
  { day: 'Wed', active: false, hours: '-' },
  { day: 'Thu', active: true, hours: '13:00 - 18:00' },
  { day: 'Fri', active: true, hours: '09:00 - 15:00' },
])
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-slate-800">Mentoring Schedule</h1>
        <button class="text-[#00d4e3] font-semibold text-sm hover:underline">View Calendar</button>
      </div>

      <div class="space-y-4">
        <div v-for="session in upcomingSessions" :key="session.id" class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
              {{ session.student.substring(0,2).toUpperCase() }}
            </div>
            <div>
              <h4 class="font-bold text-slate-800">{{ session.student }}</h4>
              <p class="text-xs text-slate-500">{{ session.topic }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-slate-800 text-sm">{{ session.time }}</p>
            <p class="text-xs text-green-500 font-bold uppercase">{{ session.date }}</p>
          </div>
          <div class="ml-4 pl-4 border-l border-slate-100">
             <button class="bg-[#1a1b41] text-white w-10 h-10 rounded-lg hover:bg-[#00d4e3] hover:text-[#1a1b41] transition">
               <i class="fa-solid fa-video"></i>
             </button>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div class="bg-white p-6 rounded-2xl shadow-sm">
        <h3 class="font-bold text-slate-800 mb-6">Weekly Availability</h3>
        <div class="space-y-4">
          <div v-for="slot in availability" :key="slot.day" class="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0">
            <div class="flex items-center gap-3">
               <div 
                 @click="slot.active = !slot.active"
                 class="w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300"
                 :class="slot.active ? 'bg-[#00d4e3]' : 'bg-slate-300'"
               >
                 <div class="w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-300" :class="slot.active ? 'left-6' : 'left-1'"></div>
               </div>
               <span class="font-bold text-slate-700 w-8">{{ slot.day }}</span>
            </div>
            <span class="text-xs text-slate-500">{{ slot.hours }}</span>
          </div>
        </div>
        <button class="w-full mt-6 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition">
          Edit Time Slots
        </button>
      </div>
    </div>
  </div>
</template>