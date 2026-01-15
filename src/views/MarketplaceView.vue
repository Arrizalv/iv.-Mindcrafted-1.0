<template>
  <div>
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Skill Service Marketplace</h1>
        <p class="text-slate-500">Find expert services for your projects</p>
      </div>
      <select class="bg-white border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-brand-accent">
        <option>Most Relevant</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
      </select>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="w-full lg:w-64 flex-shrink-0 space-y-6">
        <div>
          <h3 class="font-semibold text-sm mb-2">Search Services</h3>
          <input type="text" placeholder="Search..." class="w-full border border-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:border-brand-accent">
        </div>
        <div>
          <h3 class="font-semibold text-sm mb-2">Category</h3>
          <div class="space-y-2 text-sm text-slate-600">
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked class="accent-brand-dark"> Development</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="accent-brand-dark"> Design</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="accent-brand-dark"> Data Science</label>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-sm mb-2">Price Range</h3>
          <input type="range" class="w-full h-1 bg-slate-200 accent-brand-dark rounded-lg cursor-pointer">
          <div class="flex justify-between text-xs text-slate-500 mt-1"><span>$0</span><span>$500+</span></div>
        </div>
      </div>

      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="service in services" :key="service.id" class="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
          <div class="h-40 relative">
            <img :src="service.image" class="w-full h-full object-cover">
            <span class="absolute top-2 right-2 bg-white/90 text-[10px] font-bold px-2 py-1 rounded">{{ service.category }}</span>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-slate-800 text-sm mb-1">{{ service.title }}</h3>
            <p class="text-xs text-slate-500 mb-2">{{ service.provider }}</p>
            <div class="flex gap-2 mb-3">
              <span 
                v-for="tag in service.tags" 
                :key="tag" 
                class="text-[10px] px-2 py-0.5 rounded"
                :class="service.tagColor"
              >
                {{ tag }}
              </span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-100">
              <span class="font-bold text-sm">{{ service.price }}</span>
              <button class="bg-brand-dark text-white text-xs px-3 py-1.5 rounded hover:opacity-90">View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const services = ref([
  {
    id: 1,
    title: 'Custom Web App Development',
    provider: 'TechSolutions Inc.',
    category: 'Development',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    tags: ['React', 'Node'],
    tagColor: 'bg-indigo-50 text-indigo-600',
    price: '$2,500+'
  },
  {
    id: 2,
    title: 'UI/UX Design & Prototyping',
    provider: 'Creative Minds Studio',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
    tags: ['Figma', 'Research'],
    tagColor: 'bg-purple-50 text-purple-600',
    price: '$1,500+'
  }
])
</script>