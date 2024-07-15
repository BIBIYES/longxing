// src/stores/useImageStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useImageStore = defineStore(
  'imageStore',
  () => {
    const imgs = ref([])

    const addImage = (img) => {
      imgs.value.unshift(img)
    }

    return {
      imgs,
      addImage
    }
  },
  {
    persist: true
  }
)
