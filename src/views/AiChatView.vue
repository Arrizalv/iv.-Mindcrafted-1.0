<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'
import { marked } from 'marked' // Import library markdown

const { userProfile } = useUser()
const messages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// 1. Load Chat History
const fetchMessages = async () => {
  if (!userProfile.value) return
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true }) // Urut dari lama ke baru

  if (data) messages.value = data
  scrollToBottom()
}

// 2. Kirim Pesan
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const text = userInput.value
  userInput.value = '' // Reset input langsung biar UX enak

  // A. Tampilkan pesan User di UI (Optimistic UI)
  const userMsgObj = { role: 'user', content: text }
  messages.value.push(userMsgObj)
  scrollToBottom()
  isLoading.value = true

  try {
    // B. Simpan pesan User ke DB
    await supabase.from('chat_messages').insert({
      user_id: userProfile.value.id,
      role: 'user',
      content: text
    })

    // C. Panggil AI (Kirim context 10 pesan terakhir biar hemat token tapi tetep nyambung)
    const context = messages.value.slice(-10) 
    
    const { data, error } = await supabase.functions.invoke('chat-gemini', {
      body: { messages: context }
    })

    if (error) throw error

    // D. Tampilkan Balasan AI
    const aiMsgObj = { role: 'assistant', content: data.reply }
    messages.value.push(aiMsgObj)
    
    // E. Simpan Balasan AI ke DB
    await supabase.from('chat_messages').insert({
      user_id: userProfile.value.id,
      role: 'assistant',
      content: data.reply
    })

  } catch (err) {
    console.error(err)
    messages.value.push({ role: 'assistant', content: "⚠️ Error: Gagal terhubung ke AI." })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 3. Clear Chat
const clearChat = async () => {
  if(!confirm("Hapus semua riwayat chat?")) return
  
  await supabase.from('chat_messages').delete().eq('user_id', userProfile.value.id)
  messages.value = []
}

// Helper: Markdown Parser
const renderMarkdown = (text) => {
  return marked.parse(text)
}

// Helper: Auto Scroll ke Bawah
const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<template>
  <div class="h-[calc(100vh-120px)] flex flex-col max-w-5xl mx-auto">
    
    <div class="flex justify-between items-center mb-4 px-4 md:px-0">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <i class="fa-solid fa-robot text-[#00d4e3]"></i> Mindcrafted AI
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Tanya apa saja tentang coding, karir, atau tugas.</p>
      </div>
      <button 
        @click="clearChat" 
        class="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
      >
        <i class="fa-solid fa-trash mr-1"></i> Clear Chat
      </button>
    </div>

    <div 
      ref="chatContainer"
      class="flex-1 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-4 mb-4"
    >
      <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
        <i class="fa-solid fa-comments text-6xl mb-4"></i>
        <p>Belum ada percakapan. Mulai sapa AI!</p>
      </div>

      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        class="flex gap-3"
        :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
      >
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          :class="msg.role === 'user' ? 'bg-[#1a1b41] text-white' : 'bg-[#00d4e3] text-[#1a1b41]'"
        >
          <i :class="msg.role === 'user' ? 'fa-solid fa-user' : 'fa-solid fa-robot'"></i>
        </div>

        <div 
          class="max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm"
          :class="msg.role === 'user' 
            ? 'bg-[#1a1b41] text-white rounded-tr-none' 
            : 'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-600'"
        >
          <p v-if="msg.role === 'user'">{{ msg.content }}</p>
          
          <div v-else class="prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(msg.content)"></div>
        </div>
      </div>

      <div v-if="isLoading" class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-[#00d4e3] text-[#1a1b41] flex items-center justify-center shrink-0 animate-pulse">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-600 flex gap-1 items-center">
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
          <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-2 items-end">
      <textarea 
        v-model="userInput"
        @keydown.enter.prevent="sendMessage"
        placeholder="Ketik pesan..." 
        class="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 max-h-32 resize-none dark:text-white outline-none"
        rows="1"
      ></textarea>
      
      <button 
        @click="sendMessage" 
        :disabled="isLoading || !userInput.trim()"
        class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition mb-1 mr-1"
      >
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>

  </div>
</template>

<style>
/* Styling tambahan buat Markdown (List & Code Block) */
.prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.5rem; }
.prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.5rem; }
.prose pre { background-color: #1e293b; color: #e2e8f0; padding: 0.75rem; rounded: 0.5rem; overflow-x: auto; font-family: monospace; font-size: 0.8em; margin-top: 0.5rem; margin-bottom: 0.5rem; border-radius: 8px;}
.prose code { background-color: rgba(0,0,0,0.1); padding: 0.1rem 0.3rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
.dark .prose code { background-color: rgba(255,255,255,0.1); }
.prose strong { font-weight: bold; }
</style>