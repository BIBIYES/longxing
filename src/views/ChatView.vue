
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { useSessionStore } from '@/stores/sessionStore'
import { useRouter, useRoute } from 'vue-router'
import 'github-markdown-css/github-markdown.css'
import { convertBase64 } from '@/utils/imgBase64Util'
const router = useRouter()
const sessionStore = useSessionStore()
const route = useRoute()
const question = ref('')
const messages = ref([])
const chatBox = ref(null)
const textareaRef = ref(null)
let imgBase64 = ref('')
const fileInputRef = ref(null)
let ws = ref(null)
let currentMessage = ref(null)
let messageId = ref(0)

const fetchChatData = () => {
  const sessionId = route.params.id
  const session = sessionStore.sessions.find((s) => s.id == sessionId)
  if (session) {
    messages.value = session.messages
    messageId.value = session.messages.length
  }

  const initialMessage = route.query.initialMessage
  if (initialMessage) {
    addUserMessage(initialMessage)
  }
}

const connect = () => {
  ws.value = new WebSocket('ws://localhost:8080/ws/1')

  ws.value.onmessage = (event) => {
    if (event.data === '|') {
      if (currentMessage.value) {
        const completeMessage = {
          id: currentMessage.value.id,
          role: currentMessage.value.role,
          content: currentMessage.value.content.trim()
        }
        messages.value = messages.value.map((msg) =>
          msg.id === completeMessage.id ? completeMessage : msg
        )
        currentMessage.value = null
        scrollToBottom()
      }
      return
    }

    if (!currentMessage.value) {
      currentMessage.value = {
        id: messageId.value++,
        role: 'assistant',
        content: '',
        content_type:'text'
      }
      messages.value.push(currentMessage.value)
    }

    currentMessage.value.content += event.data
    messages.value = messages.value.map((msg) =>
      msg.id === currentMessage.value.id ? currentMessage.value : msg
    )
    scrollToBottom()
  }

  ws.value.onopen = () => {
    console.log('连接成功')
  }

  ws.value.onclose = () => {
    console.log('连接关闭，正在尝试重连...')
    setTimeout(connect, 1000)
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket错误: ', error)
  }
}

const sendMessage = () => {
  if (question.value.trim() === '') return
  addUserMessage(question.value)
  question.value = ''
}

const addUserMessage = (messageContent) => {
  const userMessage = {
    // id: messageId.value++,
    role: 'user',
    content: messageContent,
    content_type:"text"
    
  }
  messages.value.push(userMessage)
  scrollToBottom()
  sendToServer()
}

const sendToServer = () => {
  const messagePayload = {
    question: messages.value.map((msg) => ({
      role: msg.role,
      content: msg.content
    })),
    userid: 1
  }

  fetch('http://localhost:8080/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messagePayload)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
    })
    .catch((error) => {
      console.error('There was a problem with the fetch operation:', error)
    })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight
    }
  })
}

const getTheFirstRouteRequest = () => {
  const initialMessage = route.query.question
  if (initialMessage) {
    addUserMessage(initialMessage)
  }
}

// 输入框高度自适应
const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

onMounted(() => {
  connect()
  fetchChatData()

  const waitForConnection = () => {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          resolve()
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      checkConnection()
    })
  }

  waitForConnection().then(() => {
    getTheFirstRouteRequest()
    router.replace({ query: null })
  })

  const textarea = document.getElementById('inputTextarea')
  if (textarea) {
    textarea.addEventListener('input', adjustHeight)
  }
})

watch(() => route.params.id, fetchChatData)
// 图片处理
const handleFileChange = (event) => {
  convertBase64(event)
    .then((base64String) => {
      imgBase64.value = base64String
    })
    .catch((error) => {
      console.error('文件读取错误:', error)
    })
}
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef is not set')
  }
}

</script>

<template>
  <div class="chat-container">
    <div class="chat-messages markdown-body" ref="chatBox">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        <template v-if="msg.role === 'assistant'">
          <p>{{ msg.content }}</p>
        </template>
        <template v-else-if="msg.content_type === 'text'">
          <p v-html="msg.content"></p>
        </template>
        <template v-else-if="msg.content_type === 'image'">
          <img
            :src="`data:image/png;base64,${msg.content}`"
            alt="Uploaded Image"
            class="message-image"
          />
        </template>
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
            <img src="../assets/img/上传.png" alt="Upload Icon" />
          </div>
          <div class="icon icon-record" @click="startRecording">
            <img src="../assets/img/录音.png" alt="Recording Icon" />
          </div>
          <textarea
            ref="textareaRef"
            id="inputTextarea"
            rows="1"
            placeholder="给“龙萌说些什么”发送消息"
            @input="adjustHeight"
            v-model="question"
          ></textarea>
          <div class="icon icon-send" @click="sendMessage">
            <img src="../assets/img/发送.png" alt="Send Icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style lang="less" scoped>
@import 'github-markdown-css/github-markdown.css';

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
  margin: auto;
  box-sizing: border-box;

  .chat-messages {
    flex: 1;
    padding: 20px 40px;
    overflow-y: auto;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    border-radius: 10px;

    .message {
      width: auto;
      max-width: 70%;
      padding: 10px;
      margin: 5px 0;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background-color: #ffffff;
      word-wrap: break-word;
      position: relative;
      display: inline-block;

      &.user {
        align-self: flex-end;
        background-color: #dcf8c6;
        border-radius: 10px 10px 0 10px;
      }

      &.assistant {
        align-self: flex-start;
        background-color: #f1f0f0;
        border-radius: 10px 10px 10px 0;
      }

      .message-image {
        width: 200px;
        border-radius: 10px;
      }
    }
  }
  //输入框
  .input-container {
    width: 100%;
    padding: 10px;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;

    .input-section {
      display: flex;
      flex-direction: column;
      justify-content: start;
      width: 50%;

      .image-preview {
        width: 100px;
        height: 100px;
        background-color: red;
        overflow: hidden;
        border-radius: 5px;
        margin-bottom: 5px;

        img {
          width: 100%;
        }
      }

      .input-controls {
        width: 100%;
        display: flex;
        align-items: flex-end;
        border-radius: 50px;
        padding: 10px 20px;
        background-color: #f5f5f5;
        position: relative;

        textarea {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          width: 100%;
          max-height: 150px;
          height: auto;
          border: none;
          outline: none;
          background: none;
          resize: none;
          padding: 0;
          box-sizing: border-box;
          overflow-y: auto;
          flex-grow: 1;
          max-height: 300px;
          min-height: 23px;
          line-height: 20px;
        }

        .icon {
          width: 30px;
          height: 30px;

          border-radius: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: invert(100%);
          }

          &.icon-upload,
          &.icon-record {
            margin-right: 10px;
          }

          &.icon-send {
            margin-left: 10px;
          }
        }
      }
    }
  }
}
</style>