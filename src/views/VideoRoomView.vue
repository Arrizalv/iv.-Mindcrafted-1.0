<template>
    <div class="fixed inset-0 bg-slate-100 z-[100] flex flex-col">
        <div class="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-video text-brand-accent"></i>
                <div>
                    <h2 class="font-bold text-slate-800 text-sm">{{ roomName }}</h2>
                    <p class="text-xs text-slate-500">Hosted by Sarah Johnson • 6 participants</p>
                </div>
            </div>
            <router-link to="/discussion" class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition decoration-none flex items-center">
                <i class="fa-solid fa-phone-slash mr-2"></i> Leave Room
            </router-link>
        </div>

        <div class="flex-1 flex overflow-hidden">
            <div class="flex-1 p-4 flex flex-col gap-4">
                <div class="flex-1 bg-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div class="text-center">
                        <div class="w-24 h-24 bg-brand-dark text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">SJ</div>
                        <h3 class="font-semibold text-slate-700">Sarah Johnson</h3>
                        <span class="bg-brand-accent text-white text-[10px] px-2 py-1 rounded-full mt-2 inline-block">Speaking</span>
                    </div>
                </div>

                <div class="flex justify-center gap-4 mt-2">
                    <button class="w-12 h-12 rounded-full bg-brand-dark text-white hover:bg-opacity-90 flex items-center justify-center"><i class="fa-solid fa-microphone"></i></button>
                    <button class="w-12 h-12 rounded-full bg-brand-dark text-white hover:bg-opacity-90 flex items-center justify-center"><i class="fa-solid fa-video"></i></button>
                    <button class="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center"><i class="fa-solid fa-desktop"></i></button>
                </div>
            </div>

            <div class="w-80 bg-white border-l border-slate-200 flex flex-col">
                <div class="p-4 border-b border-slate-100 font-bold text-slate-700">Chat</div>
                <div class="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div>
                        <div class="flex justify-between text-[10px] text-slate-400 mb-1"><span>Sarah Johnson</span><span>10:30 AM</span></div>
                        <p class="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg rounded-tl-none">Welcome everyone!</p>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-100 flex gap-2">
                    <input type="text" placeholder="Type a message..." class="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-accent">
                    <button class="bg-brand-dark text-white w-8 h-8 rounded-lg flex items-center justify-center"><i class="fa-solid fa-paper-plane text-xs"></i></button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ roomName: string }>()
</script>