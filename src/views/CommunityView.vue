<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Learning Community</h1>
      <p class="text-slate-500">Connect, share, and learn together</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 space-y-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm">
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-brand-dark text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">XV</div>
            <div class="flex-1">
              <textarea placeholder="Share your thoughts, questions, or achievements..." class="w-full border-none resize-none focus:ring-0 text-sm h-12 outline-none"></textarea>
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                <div class="flex gap-2">
                  <button class="text-xs bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200">Add Tags</button>
                  <button class="text-xs bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200">Add Media</button>
                </div>
                <button class="bg-brand-dark text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90">Post</button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1">
          <button class="bg-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold">All Posts</button>
          <button class="bg-white border border-slate-200 text-slate-500 px-4 py-1.5 rounded-full text-xs hover:bg-slate-50">Trending</button>
          <button class="bg-white border border-slate-200 text-slate-500 px-4 py-1.5 rounded-full text-xs hover:bg-slate-50">Following</button>
        </div>

        <div v-for="post in posts" :key="post.id" class="bg-white p-5 rounded-2xl shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" :class="post.avatarColor">
                {{ post.initials }}
              </div>
              <div>
                <h4 class="text-sm font-bold flex items-center gap-2">
                  {{ post.author }} 
                  <span v-if="post.isTrending" class="bg-brand-accent text-white text-[9px] px-1.5 py-0.5 rounded">Trending</span>
                </h4>
                <p class="text-xs text-slate-500">{{ post.role }} • {{ post.time }}</p>
              </div>
            </div>
            <i class="fa-solid fa-ellipsis text-slate-400 cursor-pointer"></i>
          </div>
          <p class="text-sm text-slate-700 mb-3 leading-relaxed">
            {{ post.content }}
          </p>
          <div class="flex gap-2 mb-4">
            <span 
              v-for="tag in post.tags" 
              :key="tag" 
              class="text-[10px] px-2 py-1 rounded font-medium"
              :class="post.tagStyle"
            >
              #{{ tag }}
            </span>
          </div>
          <div class="flex items-center gap-6 text-slate-500 text-xs border-t border-slate-100 pt-3">
            <span class="cursor-pointer hover:text-red-500"><i class="fa-regular fa-heart mr-1"></i> {{ post.likes }}</span>
            <span class="cursor-pointer hover:text-blue-500"><i class="fa-regular fa-comment mr-1"></i> {{ post.comments }}</span>
            <span class="cursor-pointer hover:text-brand-dark"><i class="fa-solid fa-share-nodes mr-1"></i> Share</span>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-72 flex-shrink-0 space-y-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm">
          <div class="relative mb-4">
             <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
             <input type="text" placeholder="Search community..." class="w-full pl-8 pr-3 py-2 bg-slate-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-accent outline-none">
          </div>
          <h3 class="font-bold text-sm mb-4">Trending Topics</h3>
          <div class="space-y-4">
            <div v-for="topic in trendingTopics" :key="topic.name" class="flex justify-between items-center cursor-pointer group">
              <div>
                <p class="text-xs font-semibold group-hover:text-brand-accent">{{ topic.name }}</p>
                <p class="text-[10px] text-slate-500">{{ topic.posts }} posts</p>
              </div>
              <i class="fa-solid fa-arrow-trend-up text-brand-accent text-xs"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const trendingTopics = ref([
  { name: '#React 19', posts: '1,234' },
  { name: '#AI & Machine Learning', posts: '2,341' },
  { name: '#Career Growth', posts: '987' }
])

const posts = ref([
  {
    id: 1,
    initials: 'SJ',
    avatarColor: 'bg-indigo-500',
    author: 'Sarah Johnson',
    role: 'Senior Full Stack Developer',
    time: '2 hours ago',
    isTrending: true,
    content: 'Just finished implementing a custom authentication system using JWT tokens and refresh token rotation. The security improvements are significant! Here are some key takeaways... 🔐',
    tags: ['Authentication', 'Security', 'JavaScript'],
    tagStyle: 'bg-indigo-50 text-indigo-700',
    likes: 45,
    comments: 12
  },
  {
    id: 2,
    initials: 'MC',
    avatarColor: 'bg-purple-500',
    author: 'Michael Chen',
    role: 'UI/UX Designer',
    time: '4 hours ago',
    isTrending: false,
    content: "What are your thoughts on the new design trends for 2026? I've been seeing a lot of glassmorphism and neomorphism combinations. Would love to hear the community's perspective! 🎨",
    tags: ['Design', 'UIUX', 'Trends'],
    tagStyle: 'bg-purple-50 text-purple-700',
    likes: 78,
    comments: 34
  }
])
</script>