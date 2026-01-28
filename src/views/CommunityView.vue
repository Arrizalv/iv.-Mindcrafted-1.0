<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'
import { useWeb3 } from '../composables/useWeb3' 

// --- COMPOSABLES ---
const { userProfile } = useUser()
const {
  isMetaMaskInstalled,
  isConnected,
  shortAddress,
  balance,
  networkName,
  isProcessing,
  transactionState,
  errorMessage,
  COMMENT_PAYMENT_AMOUNT,
  connectWallet,
  disconnectWallet,
  payForComment,
  resetTransactionState
} = useWeb3()

// --- STATE ---
const posts = ref([])
const loading = ref(true)
const newPostContent = ref('')
const newPostTags = ref('')
const filter = ref('All') // All, Trending, My Posts

// Comment Modal State
const showCommentModal = ref(false)
const selectedPost = ref(null)
const commentText = ref('')
const commentsList = ref([]) // Komentar utk post yg dipilih
const loadingComments = ref(false)

// --- FETCH DATA ---
const fetchPosts = async () => {
  loading.value = true
  
  let query = supabase
    .from('community_posts')
    .select(`
      *,
      profiles:user_id ( full_name, avatar_url, role ),
      post_likes ( user_id )
    `)
    .order('created_at', { ascending: false })

  // Filter Logic
  if (filter.value === 'My Posts' && userProfile.value) {
    query = query.eq('user_id', userProfile.value.id)
  }

  const { data, error } = await query

  if (data) {
    // Transform data biar gampang dipake di template
    posts.value = data.map(post => ({
      ...post,
      isLiked: post.post_likes.some(like => like.user_id === userProfile.value?.id),
      likes_count: post.likes_count || 0, // Fallback kalo null
      comments_count: post.comments_count || 0
    }))
  }
  loading.value = false
}

// --- ACTIONS: POSTING ---
const createPost = async () => {
  if (!userProfile.value) return alert("Please login first")
  if (!newPostContent.value.trim()) return

  // Convert string tags "react, js" -> array ["react", "js"]
  const tagsArray = newPostTags.value.split(',').map(t => t.trim()).filter(t => t)

  const { error } = await supabase.from('community_posts').insert({
    user_id: userProfile.value.id,
    content: newPostContent.value,
    tags: tagsArray
  })

  if (!error) {
    newPostContent.value = ''
    newPostTags.value = ''
    fetchPosts() // Refresh feed
  } else {
    alert(error.message)
  }
}

// --- ACTIONS: LIKING ---
const toggleLike = async (post) => {
  if (!userProfile.value) return alert("Login to like")

  if (post.isLiked) {
    // Unlike
    const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: userProfile.value.id })
    if (!error) {
      post.isLiked = false
      post.likes_count--
    }
  } else {
    // Like
    const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: userProfile.value.id })
    if (!error) {
      post.isLiked = true
      post.likes_count++
    }
  }
}

// --- ACTIONS: COMMENTING (WEB3 INTEGRATED) ---
const openCommentModal = async (post) => {
  selectedPost.value = post
  showCommentModal.value = true
  resetTransactionState()
  commentText.value = ''
  
  // Fetch existing comments
  loadingComments.value = true
  const { data } = await supabase
    .from('community_comments')
    .select(`*, profiles:user_id(full_name, avatar_url)`)
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })
  
  commentsList.value = data || []
  loadingComments.value = false
}

const submitCommentWithPayment = async () => {
  if (!commentText.value.trim() || !isConnected.value) return

  // 1. Proses Pembayaran via MetaMask
  const txHash = await payForComment() // Asumsi composable mengembalikan hash jika sukses, atau true
  
  // Jika sukses bayar (ada hash atau return true)
  if (txHash) {
    // 2. Simpan ke Database Supabase
    const { error } = await supabase.from('community_comments').insert({
      post_id: selectedPost.value.id,
      user_id: userProfile.value.id,
      content: commentText.value,
      tx_hash: typeof txHash === 'string' ? txHash : '0x...' // Simpan hash transaksi
    })

    if (!error) {
      // Update UI
      if (selectedPost.value) selectedPost.value.comments_count++
      
      setTimeout(() => {
        showCommentModal.value = false
      }, 2000)
    } else {
      alert("Payment success but failed to save comment: " + error.message)
    }
  }
}

// Helper Date
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Learning Community</h1>
      <p class="text-slate-500 dark:text-slate-400">Connect, share, and learn together.</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      
      <div class="flex-1 space-y-6">
        
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div class="flex gap-4">
            <img :src="userProfile?.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-10 h-10 rounded-full object-cover">
            <div class="flex-1">
              <textarea 
                v-model="newPostContent"
                placeholder="Share your thoughts, questions, or achievements..." 
                class="w-full border-none resize-none focus:ring-0 text-sm h-16 outline-none bg-transparent dark:text-white placeholder:text-slate-400"
              ></textarea>
              
              <input 
                v-model="newPostTags"
                type="text" 
                placeholder="Tags (e.g. react, design, help) - comma separated"
                class="w-full text-xs bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1 mb-2 outline-none dark:text-slate-300"
              >

              <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div class="flex gap-2">
                  <button class="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                    <i class="fa-solid fa-image mr-1"></i> Media
                  </button>
                </div>
                <button 
                  @click="createPost" 
                  :disabled="!newPostContent"
                  class="bg-[#1a1b41] dark:bg-[#00d4e3] text-white dark:text-[#1a1b41] text-xs font-bold px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            v-for="f in ['All', 'Trending', 'My Posts']" 
            :key="f"
            @click="filter = f; fetchPosts()"
            class="px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
            :class="filter === f ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'"
          >
            {{ f }}
          </button>
        </div>

        <div v-if="loading" class="space-y-4">
           <div v-for="n in 3" :key="n" class="bg-white dark:bg-slate-800 h-40 rounded-2xl animate-pulse"></div>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <p class="text-slate-500 dark:text-slate-400">No posts found. Be the first to share!</p>
        </div>

        <div v-else v-for="post in posts" :key="post.id" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div class="flex justify-between items-start mb-3">
            <div class="flex gap-3">
              <img :src="post.profiles?.avatar_url || 'https://ui-avatars.com/api/?name='+post.profiles?.full_name" class="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-600">
              <div>
                <h4 class="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  {{ post.profiles?.full_name }} 
                  <span v-if="post.profiles?.role === 'instructor'" class="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded uppercase">Instructor</span>
                </h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">{{ timeAgo(post.created_at) }}</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-ellipsis"></i></button>
          </div>

          <p class="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed whitespace-pre-line">
            {{ post.content }}
          </p>

          <div class="flex flex-wrap gap-2 mb-4" v-if="post.tags && post.tags.length">
            <span 
              v-for="tag in post.tags" :key="tag" 
              class="text-[10px] px-2 py-1 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              #{{ tag }}
            </span>
          </div>

          <div class="flex items-center gap-6 text-slate-500 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-700 pt-3">
            <button 
              @click="toggleLike(post)"
              class="flex items-center gap-1 hover:text-red-500 transition"
              :class="{'text-red-500 font-bold': post.isLiked}"
            >
              <i :class="post.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i> {{ post.likes_count }}
            </button>
            
            <button 
              @click="openCommentModal(post)"
              class="flex items-center gap-1 hover:text-blue-500 transition"
            >
              <i class="fa-regular fa-comment"></i> {{ post.comments_count }}
            </button>
            
            <button class="flex items-center gap-1 hover:text-green-500 transition ml-auto">
               <i class="fa-solid fa-share-nodes"></i> Share
            </button>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-80 flex-shrink-0 space-y-6">
        
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
            <i class="fa-brands fa-ethereum text-indigo-500"></i>
            Web3 Wallet
          </h3>
          
          <div v-if="!isMetaMaskInstalled" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs rounded-lg mb-2">
            MetaMask not detected. Please install extension.
          </div>

          <div v-else-if="isConnected" class="space-y-3">
            <div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 dark:text-green-400 font-bold">Connected</span>
              <span class="ml-auto text-[10px] font-mono text-slate-500 dark:text-slate-400">{{ shortAddress }}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
               <div class="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                 <p class="text-[10px] text-slate-400">Balance</p>
                 <p class="text-xs font-bold dark:text-white">{{ parseFloat(balance).toFixed(4) }} ETH</p>
               </div>
               <div class="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                 <p class="text-[10px] text-slate-400">Network</p>
                 <p class="text-xs font-bold dark:text-white truncate">{{ networkName }}</p>
               </div>
            </div>

            <button @click="disconnectWallet" class="w-full text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition">
              Disconnect Wallet
            </button>
          </div>

          <div v-else>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Connect wallet to comment and earn reputation.</p>
            <button 
              @click="connectWallet"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="fa-brands fa-ethereum"></i> Connect MetaMask
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 class="font-bold text-sm mb-4 text-slate-800 dark:text-white">Trending Topics</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center group cursor-pointer" v-for="i in 3" :key="i">
              <div>
                <p class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#00d4e3]">#WebDevelopment</p>
                <p class="text-[10px] text-slate-400">2.4k posts</p>
              </div>
              <i class="fa-solid fa-arrow-trend-up text-slate-300 text-xs"></i>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="showCommentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" @click.self="closeCommentModal">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border dark:border-slate-700 animate-fade-in-up flex flex-col max-h-[90vh]">
        
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shrink-0">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">Discussion</h3>
            <button @click="showCommentModal = false" class="hover:bg-white/20 p-1 rounded-full"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <p class="text-xs text-indigo-100 mt-1 line-clamp-1">Post by {{ selectedPost?.profiles?.full_name }}</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
           <div v-if="loadingComments" class="text-center text-slate-400 py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading comments...</div>
           <div v-else-if="commentsList.length === 0" class="text-center text-slate-400 py-4 text-xs">No comments yet. Be the first!</div>
           
           <div v-for="comment in commentsList" :key="comment.id" class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
              <div class="flex items-center gap-2 mb-1">
                 <img :src="comment.profiles?.avatar_url" class="w-5 h-5 rounded-full">
                 <span class="font-bold text-xs dark:text-white">{{ comment.profiles?.full_name }}</span>
                 <span v-if="comment.tx_hash" class="text-[9px] bg-amber-100 text-amber-700 px-1 rounded" title="Paid with ETH">💎 Paid</span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 text-xs">{{ comment.content }}</p>
           </div>
        </div>

        <div class="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
          
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg p-3 mb-3 flex gap-3">
             <i class="fa-brands fa-ethereum text-amber-500 text-xl mt-0.5"></i>
             <div>
               <p class="text-xs font-bold text-amber-800 dark:text-amber-400">Pay-to-Comment Enabled</p>
               <p class="text-[10px] text-amber-600 dark:text-amber-500/80">
                 Fee: <span class="font-bold">{{ COMMENT_PAYMENT_AMOUNT }} ETH</span>. Helps reduce spam & maintain quality.
               </p>
             </div>
          </div>

          <div v-if="transactionState === 'pending'" class="text-center py-2 text-blue-500 text-xs font-bold animate-pulse">
            Waiting for confirmation in MetaMask...
          </div>
          <div v-if="transactionState === 'success'" class="text-center py-2 text-green-500 text-xs font-bold">
            Payment Confirmed! Posting comment...
          </div>
          <div v-if="transactionState === 'error'" class="text-center py-2 text-red-500 text-xs font-bold">
            {{ errorMessage }}
          </div>

          <div class="flex gap-2">
            <input 
              v-model="commentText" 
              type="text" 
              placeholder="Write a valuable comment..." 
              class="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white"
              :disabled="!isConnected || isProcessing"
            >
            <button 
              @click="submitCommentWithPayment"
              :disabled="!isConnected || !commentText.trim() || isProcessing"
              class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <span v-if="isProcessing">Processing...</span>
              <span v-else>Pay & Post</span>
            </button>
          </div>
          <p v-if="!isConnected" class="text-[10px] text-red-400 mt-2 text-center">Please connect wallet first.</p>
        </div>

      </div>
    </div>

  </div>
</template>