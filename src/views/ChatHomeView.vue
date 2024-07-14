<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Typed from 'typed.js'
import { generateUUID } from '@/utils/uuid'
import { convertBase64 } from '@/utils/imgBase64Util'
import VoiceRecognizer from '@/utils/VoiceRecognizer'
const textareaRef = ref(null)
const typewriterElement = ref(null)
let typed = null
const question = ref(null)
const voiceRecognizer = new VoiceRecognizer()
const router = useRouter()
let imgBase64 = ref(null)
const fileInputRef = ref(null)
const sessionStore = useSessionStore()
const isVoiceLoading = ref(false)
const isRecording = ref(false)
let placeholderText = ref('给“龙梦说些什么”发送消息')

// 发送消息的函数
const sendMessage = () => {
  if (question.value && imgBase64.value) {
    const uuid = generateUUID()
    console.log('生成了一个uuid ' + uuid)
    // 创建一个消息
    sessionStore.createNewMessage(uuid, question.value)
    router.push({
      name: 'chat',
      params: { id: uuid },
      query: { question: question.value, imgBase64: imgBase64.value }
    })
  } else if (question.value) {
    const uuid = generateUUID()
    console.log('生成了一个uuid ' + uuid)
    // 创建一个消息
    sessionStore.createNewMessage(uuid, question.value)
    router.push({
      name: 'chat',
      params: { id: uuid },
      query: { question: question.value }
    })
  } else {
    console.warn('你未输入任何东西')
  }
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef 未设置')
  }
}
// 录音控制
const startRecording = () => {
  handelIsVoiceLoading()
  if (isRecording.value) {
    voiceRecognizer.stop()
    isRecording.value = false
  } else {
    voiceRecognizer.start()
    voiceRecognizer.onResult = (result) => {
      question.value += result
    }
    isRecording.value = true
  }
}

const handelIsVoiceLoading = () => {
  if (isVoiceLoading.value) {
    isVoiceLoading.value = false
  } else {
    isVoiceLoading.value = true
  }
}
// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    if (question.value.trim() !== '') {
      // 仅在输入框不为空时发送消息
      sendMessage()
    }
  }
}
const fontAnimation = () => {
  typed = new Typed(typewriterElement.value, {
    strings: [
      'Hi，我是龙梦GPT',
      '运行在龙芯平台的多元化GPT',
      '今天有什么可以帮到您？'
    ],
    // 打字速度
    typeSpeed: 100,
    // 退格速度
    backSpeed: 20,
    // 是否循环
    loop: false,
    showCursor: false
  })
}
onMounted(() => {
  fontAnimation()
})

// 输入框自适应
const adjustHeight = () => {
  const textarea = textareaRef.value
  textarea.style.height = 'auto' // Reset height to auto to calculate new height
  textarea.style.height = textarea.scrollHeight + 'px' // Set new height based on scrollHeight
}
// 处理文件
const handleFileChange = (event) => {
  convertBase64(event)
    .then((base64String) => {
      imgBase64.value = base64String
    })
    .catch((error) => {
      console.error('文件读取错误:', error)
    })
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-messages-box">
      <div class="chat-messages-box-content">
        <div class="logo-box flowing-text">
          <h3>LOONGSONGPT</h3>
        </div>
        <div class="content" ref="typewriterElement">
          <!-- 这里需要typed-->
          你好我是龙梦GPT
        </div>
        <div class="item-box">
          <div class="item">
            <div class="icon">
              <img src="../assets/img/bulb-on-svgrepo-com.png" alt="" />
            </div>
            <div class="text">给您提供一个灵感</div>
          </div>
          <div class="item">
            <div class="icon">
              <img src="../assets/img/code-svgrepo-com.png" alt="" />
            </div>
            <div class="text">帮您检查代码</div>
          </div>
          <div class="item">
            <div class="icon">
              <img
                src="../assets/img/calendar-lines-pen-svgrepo-com.png"
                alt=""
              />
            </div>
            <div class="text">帮您制定健身计划</div>
          </div>
          <div class="item">
            <div class="icon">
              <img src="../assets/img/search.png" alt="" />
            </div>
            <div class="text">AIGC帮你生成背景图场景图</div>
          </div>
        </div>
      </div>
    </div>
    <div class="input-container">
      <div class="input-section">
        <div class="image-preview" v-show="imgBase64">
          <img :src="`data:image/png;base64,${imgBase64}`" alt="" />
        </div>
        <div class="input-controls">
          <input
            type="file"
            @change="handleFileChange"
            accept="image/*"
            style="display: none"
            ref="fileInputRef"
          />
          <div class="icon icon-upload" @click="triggerFileInput">
            <!-- <img src="../assets/img/上传.png" alt="Upload Icon" /> -->
            <el-icon :size="28"><UploadFilled /></el-icon>
          </div>
          <div class="icon icon-record" @click="startRecording">
            <VoiceLoading v-if="isVoiceLoading"></VoiceLoading>
            <el-icon v-else :size="23"><Microphone /></el-icon>
            <!-- <img src="../assets/img/录音.png" alt="Recording Icon"  /> -->
          </div>
          <textarea
            ref="textareaRef"
            id="inputTextarea"
            rows="1"
            :placeholder="placeholderText"
            @input="adjustHeight"
            @keyup="handleKeyUp"
            v-model="question"
          ></textarea>
          <div class="icon icon-send" @click="sendMessage">
            <img src="../assets/img/send-alt-svgrepo-com.svg" alt="Send Icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../assets/css/main/ChatHomeView.less';
</style>
