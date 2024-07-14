<template>
  <div>
    <button @click="startRecognition">开始识别</button>
    <button @click="stopRecognition">关闭识别</button>
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VoiceRecognition from '@/utils/Voice.js'

const text = ref('')
const voiceRecognition = new VoiceRecognition()

const updateText = () => {
  text.value = voiceRecognition.getText()
}

const startRecognition = () => {
  voiceRecognition.start()
  const intervalId = setInterval(() => {
    updateText()
  }, 500) // Update text every 500ms

  stopRecognition.intervalId = intervalId
}

const stopRecognition = () => {
  const resultText = voiceRecognition.stop()
  text.value = resultText
  clearInterval(stopRecognition.intervalId)
}
</script>
