<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// Props: Menerima bucket tujuan dan URL gambar saat ini (kalau mode edit)
const props = defineProps({
  bucket: { type: String, required: true }, // 'course-images', 'mentor-images', dll
  defaultImage: { type: String, default: '' },
  label: { type: String, default: 'Upload Image' }
})

// Emits: Mengirim URL hasil upload ke parent
const emit = defineEmits(['update:url'])

const uploading = ref(false)
const previewUrl = ref(props.defaultImage)

const handleUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validasi (Max 2MB)
  if (file.size > 2 * 1024 * 1024) return alert("Maksimal ukuran file 2MB!")
  
  uploading.value = true

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Upload ke Supabase
    const { error: uploadError } = await supabase.storage
      .from(props.bucket)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 2. Ambil URL Publik
    const { data } = supabase.storage
      .from(props.bucket)
      .getPublicUrl(filePath)

    // 3. Update Preview & Kirim URL ke Parent
    previewUrl.value = data.publicUrl
    emit('update:url', data.publicUrl)

  } catch (error) {
    alert("Upload gagal: " + error.message)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{{ label }}</label>
    
    <div class="relative group w-full h-48 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden hover:border-[#00d4e3] transition-colors flex flex-col items-center justify-center cursor-pointer">
      
      <input 
        type="file" 
        accept="image/*" 
        @change="handleUpload" 
        :disabled="uploading"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      >

      <div v-if="uploading" class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-30 flex items-center justify-center">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#00d4e3]"></i>
      </div>

      <img v-if="previewUrl" :src="previewUrl" class="absolute inset-0 w-full h-full object-cover z-10">

      <div v-if="!previewUrl" class="text-center p-4">
        <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
          <i class="fa-solid fa-cloud-arrow-up text-slate-400"></i>
        </div>
        <p class="text-xs text-slate-500 font-bold">Click to upload</p>
        <p class="text-[10px] text-slate-400">PNG, JPG (Max 2MB)</p>
      </div>

      <div v-if="previewUrl" class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <p class="text-white text-xs font-bold"><i class="fa-solid fa-pen mr-1"></i> Change Image</p>
      </div>

    </div>
  </div>
</template>