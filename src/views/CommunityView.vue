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
            <span 
              class="cursor-pointer hover:text-blue-500"
              @click="openCommentModal(post)"
            >
              <i class="fa-regular fa-comment mr-1"></i> {{ post.comments }}
            </span>
            <span class="cursor-pointer hover:text-brand-dark"><i class="fa-solid fa-share-nodes mr-1"></i> Share</span>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-72 flex-shrink-0 space-y-6">
        <!-- Wallet Connection Status -->
        <div class="bg-white p-5 rounded-2xl shadow-sm">
          <h3 class="font-bold text-sm mb-3 flex items-center gap-2">
            <i class="fa-brands fa-ethereum text-indigo-500"></i>
            Web3 Wallet
          </h3>
          <div v-if="!isMetaMaskInstalled" class="text-xs text-red-500 mb-2">
            MetaMask not detected. Please install MetaMask.
          </div>
          <div v-else-if="isConnected" class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 font-medium">Connected</span>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg">
              <p class="text-[10px] text-slate-500">Address</p>
              <p class="text-xs font-mono font-medium">{{ shortAddress }}</p>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg">
              <p class="text-[10px] text-slate-500">Balance</p>
              <p class="text-xs font-medium">{{ parseFloat(balance).toFixed(4) }} ETH</p>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg">
              <p class="text-[10px] text-slate-500">Network</p>
              <p class="text-xs font-medium">{{ networkName }}</p>
            </div>
            <button 
              @click="disconnectWallet" 
              class="w-full text-xs text-red-500 hover:text-red-600 mt-2"
            >
              Disconnect
            </button>
          </div>
          <div v-else>
            <button 
              @click="connectWallet"
              class="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <i class="fa-brands fa-ethereum"></i>
              Connect MetaMask
            </button>
          </div>
        </div>

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

    <!-- Comment Modal with Payment -->
    <div 
      v-if="showCommentModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCommentModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 text-white">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">Add Comment</h3>
            <button @click="closeCommentModal" class="hover:bg-white/20 p-1 rounded-full transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <p class="text-sm text-white/80 mt-1">Post: {{ selectedPost?.author }}</p>
        </div>

        <!-- Payment Info -->
        <div class="p-5 border-b border-slate-100">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <i class="fa-brands fa-ethereum text-2xl text-amber-600"></i>
              <div>
                <h4 class="font-semibold text-sm text-amber-800">Payment Required</h4>
                <p class="text-xs text-amber-700 mt-1">
                  To ensure quality discussions, a small payment of 
                  <span class="font-bold">{{ COMMENT_PAYMENT_AMOUNT }} ETH</span> 
                  is required to post a comment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Connection Status in Modal -->
        <div class="p-5 border-b border-slate-100">
          <div v-if="!isConnected" class="text-center">
            <p class="text-sm text-slate-500 mb-3">Connect your wallet to continue</p>
            <button 
              @click="connectWallet"
              :disabled="!isMetaMaskInstalled"
              class="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 w-full"
            >
              <i class="fa-brands fa-ethereum"></i>
              Connect MetaMask
            </button>
            <p v-if="!isMetaMaskInstalled" class="text-xs text-red-500 mt-2">
              MetaMask extension is required
            </p>
          </div>
          <div v-else class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-xs font-medium">{{ shortAddress }}</span>
            </div>
            <span class="text-xs text-slate-500">{{ parseFloat(balance).toFixed(4) }} ETH</span>
          </div>
        </div>

        <!-- Comment Input -->
        <div class="p-5">
          <textarea 
            v-model="commentText"
            placeholder="Write your comment..."
            class="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            :disabled="!isConnected || isProcessing"
          ></textarea>
        </div>

        <!-- Transaction States -->
        <div class="px-5 pb-3">
          <!-- Pending State -->
          <div v-if="transactionState === 'pending'" class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p class="text-sm font-medium text-blue-800">Transaction Pending</p>
                <p class="text-xs text-blue-600">Please confirm in MetaMask...</p>
              </div>
            </div>
          </div>

          <!-- Success State -->
          <div v-if="transactionState === 'success'" class="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-check-circle text-2xl text-green-500"></i>
              <div>
                <p class="text-sm font-medium text-green-800">Payment Successful!</p>
                <p class="text-xs text-green-600">Your comment has been posted.</p>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-if="transactionState === 'error'" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
            <div class="flex items-start gap-3">
              <i class="fa-solid fa-exclamation-circle text-2xl text-red-500"></i>
              <div>
                <p class="text-sm font-medium text-red-800">Transaction Failed</p>
                <p class="text-xs text-red-600">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="p-5 bg-slate-50 flex gap-3">
          <button 
            @click="closeCommentModal"
            class="flex-1 bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="submitCommentWithPayment"
            :disabled="!isConnected || !commentText.trim() || isProcessing"
            class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i class="fa-brands fa-ethereum"></i>
            Pay & Comment
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeb3 } from '../composables/useWeb3'

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

// Comment Modal State
const showCommentModal = ref(false)
const selectedPost = ref<any>(null)
const commentText = ref('')

// Open comment modal
const openCommentModal = (post: any) => {
  selectedPost.value = post
  showCommentModal.value = true
  resetTransactionState()
  commentText.value = ''
}

// Close comment modal
const closeCommentModal = () => {
  showCommentModal.value = false
  selectedPost.value = null
  commentText.value = ''
  resetTransactionState()
}

// Submit comment with payment
const submitCommentWithPayment = async () => {
  if (!commentText.value.trim() || !isConnected.value) return

  const success = await payForComment()
  
  if (success) {
    // In a real app, you would save the comment to your backend here
    console.log('Comment submitted:', commentText.value)
    
    // Update the post's comment count
    if (selectedPost.value) {
      selectedPost.value.comments++
    }

    // Close modal after a brief delay to show success state
    setTimeout(() => {
      closeCommentModal()
    }, 2000)
  }
}
</script>