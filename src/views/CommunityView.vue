<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useUser } from '../composables/useUser'
import { useWeb3 } from '../composables/useWeb3' 

const { userProfile } = useUser()
const {
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

// STATE
const posts = ref([])
const loading = ref(true)
const newPostContent = ref('')
const newPostTags = ref('')
const filter = ref('All')

// STATE MODAL KOMEN
const showCommentModal = ref(false)
const selectedPost = ref(null)
const commentText = ref('')
const commentsList = ref([]) 
const loadingComments = ref(false)

// 1. FETCH POSTS
const fetchPosts = async () => {
  loading.value = true
  
  let query = supabase
    .from('community_posts')
    .select(`
      *,
      profiles:profiles!fk_community_posts_profiles ( full_name, avatar_url, role ),
      post_likes ( user_id )
    `)
    .order('created_at', { ascending: false })

  if (filter.value === 'My Posts' && userProfile.value) {
    query = query.eq('user_id', userProfile.value.id)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetch posts:", error)
  }

  if (data) {
    posts.value = data.map(post => ({
      ...post,
      isLiked: post.post_likes && post.post_likes.some(like => like.user_id === userProfile.value?.id),
      likes_count: post.likes_count || 0, 
      comments_count: post.comments_count || 0
    }))
  }
  loading.value = false
}

// 2. CREATE POST
const createPost = async () => {
  if (!userProfile.value) return alert("Please login first")
  if (!newPostContent.value.trim()) return

  if (!isConnected.value) return alert("Koneksikan Wallet MetaMask dulu.")
  if (!confirm(`Posting butuh biaya ${COMMENT_PAYMENT_AMOUNT} ETH. Lanjut?`)) return

  const txHash = await payForComment() 
  
  if (txHash) {
    const tagsArray = newPostTags.value.split(',').map(t => t.trim()).filter(t => t)

    const { error } = await supabase.from('community_posts').insert({
      user_id: userProfile.value.id,
      content: newPostContent.value,
      tags: tagsArray,
      // tx_hash: txHash // Simpan hash kalau mau
    })

    if (!error) {
      newPostContent.value = ''
      newPostTags.value = ''
      alert("Success!")
      fetchPosts() 
    } else {
      alert("Error saving post: " + error.message)
    }
  }
}

// 3. LIKE
const toggleLike = async (post) => {
  if (!userProfile.value) return alert("Login to like")

  if (post.isLiked) {
    const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: userProfile.value.id })
    if (!error) { post.isLiked = false; post.likes_count-- }
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: userProfile.value.id })
    if (!error) { post.isLiked = true; post.likes_count++ }
  }
}

// 4. COMMENTS
const openCommentModal = async (post) => {
  selectedPost.value = post
  showCommentModal.value = true
  resetTransactionState()
  commentText.value = ''
  
  loadingComments.value = true
  const { data, error } = await supabase
    .from('community_comments')
    .select(`
      *, 
      /* FIX: Panggil constraint comments */
      profiles:profiles!fk_community_comments_profiles(full_name, avatar_url)
    `)
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })
  
  if (error) console.error("Error comments:", error)
  commentsList.value = data || []
  loadingComments.value = false
}

const submitCommentWithPayment = async () => {
  if (!commentText.value.trim() || !isConnected.value) return

  const txHash = await payForComment()
  
  if (txHash) {
    const { error } = await supabase.from('community_comments').insert({
      post_id: selectedPost.value.id,
      user_id: userProfile.value.id,
      content: commentText.value,
      tx_hash: typeof txHash === 'string' ? txHash : '0x...' 
    })

    if (!error) {
      if (selectedPost.value) selectedPost.value.comments_count++
      
      // Refresh list
      const { data } = await supabase
        .from('community_comments')
        .select(`*, profiles:profiles!fk_community_comments_profiles(full_name, avatar_url)`)
        .eq('post_id', selectedPost.value.id)
        .order('created_at', { ascending: true })
      commentsList.value = data || []
      
      commentText.value = ''
    } else {
      alert("Error saving comment: " + error.message)
    }
  }
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Learning Community</h1>
      <p class="text-slate-500 dark:text-slate-400">Connect, share, and earn reputation.</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 space-y-6">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div class="flex gap-4">
            <img :src="userProfile?.avatar_url || 'https://ui-avatars.com/api/?name=User'" class="w-10 h-10 rounded-full object-cover">
            <div class="flex-1">
              <textarea v-model="newPostContent" placeholder="Share your thoughts... (Fee: 0.001 ETH)" class="w-full border-none resize-none focus:ring-0 text-sm h-16 outline-none bg-transparent dark:text-white placeholder:text-slate-400"></textarea>
              <input v-model="newPostTags" type="text" placeholder="Tags (e.g. react, help)" class="w-full text-xs bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1 mb-2 outline-none dark:text-slate-300">
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span class="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold"><i class="fa-brands fa-ethereum"></i> Fee: {{ COMMENT_PAYMENT_AMOUNT }} ETH</span>
                <button @click="createPost" :disabled="!newPostContent || isProcessing" class="bg-indigo-600 text-white text-xs font-bold px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
                  <i v-if="isProcessing" class="fa-solid fa-circle-notch fa-spin"></i> {{ isProcessing ? 'Processing...' : 'Pay & Post' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-slate-400"></i></div>
        <div v-else-if="posts.length === 0" class="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700"><p class="text-slate-500 dark:text-slate-400">No posts found.</p></div>
        
        <div v-else v-for="post in posts" :key="post.id" class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div class="flex justify-between items-start mb-3">
            <div class="flex gap-3">
              <img :src="post.profiles?.avatar_url || 'https://ui-avatars.com/api/?name='+post.profiles?.full_name" class="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-600">
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ post.profiles?.full_name }}</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">{{ timeAgo(post.created_at) }}</p>
              </div>
            </div>
          </div>
          <p class="text-sm text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-line">{{ post.content }}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="tag in (post.tags || [])" :key="tag" class="text-[10px] px-2 py-1 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">#{{ tag }}</span>
          </div>
          <div class="flex items-center gap-6 text-slate-500 dark:text-slate-400 text-xs border-t border-slate-100 dark:border-slate-700 pt-3">
            <button @click="toggleLike(post)" class="hover:text-red-500 transition flex items-center gap-1" :class="{'text-red-500 font-bold': post.isLiked}"><i :class="post.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i> {{ post.likes_count }}</button>
            <button @click="openCommentModal(post)" class="hover:text-blue-500 transition flex items-center gap-1"><i class="fa-regular fa-comment"></i> {{ post.comments_count }}</button>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-6">
          <h3 class="font-bold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-white"><i class="fa-brands fa-ethereum text-indigo-500"></i> Web3 Wallet</h3>
          <div v-if="isConnected" class="space-y-3">
            <div class="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 dark:text-green-400 font-bold">Connected</span>
              <span class="ml-auto text-[10px] font-mono text-slate-500 dark:text-slate-400">{{ shortAddress }}</span>
            </div>
            <div class="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
               <p class="text-[10px] text-slate-400">Balance</p>
               <p class="text-xs font-bold dark:text-white">{{ parseFloat(balance).toFixed(4) }} ETH</p>
            </div>
            <button @click="disconnectWallet" class="w-full text-xs text-red-500 hover:bg-red-50 py-2 rounded-lg">Disconnect</button>
          </div>
          <button v-else @click="connectWallet" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">Connect MetaMask</button>
        </div>
      </div>
    </div>

    <div v-if="showCommentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" @click.self="showCommentModal = false">
      <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div class="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <h3 class="font-bold">Discussion</h3>
          <button @click="showCommentModal = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
           <div v-if="loadingComments" class="text-center text-xs text-slate-400">Loading...</div>
           <div v-else-if="commentsList.length === 0" class="text-center text-xs text-slate-400">No comments yet.</div>
           <div v-for="comment in commentsList" :key="comment.id" class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
              <div class="flex items-center gap-2 mb-1">
                 <img :src="comment.profiles?.avatar_url" class="w-5 h-5 rounded-full">
                 <span class="font-bold text-xs dark:text-white">{{ comment.profiles?.full_name }}</span>
                 <span v-if="comment.tx_hash" class="text-[9px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">💎 Paid</span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 text-xs">{{ comment.content }}</p>
           </div>
        </div>
        <div class="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <div v-if="transactionState === 'pending'" class="text-center text-xs text-blue-500 font-bold mb-2 animate-pulse">Confirm in MetaMask...</div>
          <div class="flex gap-2">
            <input v-model="commentText" type="text" placeholder="Write a comment..." class="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-4 text-sm dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" :disabled="!isConnected || isProcessing">
            <button @click="submitCommentWithPayment" :disabled="!isConnected || !commentText.trim() || isProcessing" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
              {{ isProcessing ? 'Paying...' : 'Pay & Comment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>