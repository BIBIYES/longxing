<script setup>
import { ref, onMounted } from 'vue'
import CryptoJS from 'crypto-js'
import { convertBase64 } from '@/utils/imgBase64Util'
import VoiceRecognizer from '@/utils/VoiceRecognizer'

const APP_ID = 'c3fbc474'
const API_KEY = 'f53a5d5b29d3b8c0770b3b51224dbab9'
const API_SECRET = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz'
const HOST = 'spark-api.cn-huabei-1.xf-yun.com'

const date = ref(null)
const authorization = ref(null)
const ws = ref(null)
let question = ref('')
let imgBase64 = ref('')
const messages = ref([])
const fileInputRef = ref(null)
// 增加一个状态来跟踪当前是否在录音


const generateAuthParams = () => {
  const curTime = new Date()
  date.value = curTime.toUTCString()

  const tmp = `host: ${HOST}\ndate: ${date.value}\nGET /v2.1/image HTTP/1.1`
  const tmpSha = CryptoJS.HmacSHA256(tmp, API_SECRET)
  const signature = CryptoJS.enc.Base64.stringify(tmpSha)

  const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  authorization.value = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationOrigin)
  )
}

const connectWebSocket = () => {
  const url = `wss://${HOST}/v2.1/image?authorization=${encodeURIComponent(
    authorization.value
  )}&date=${encodeURIComponent(date.value)}&host=${encodeURIComponent(HOST)}`
  console.log('WebSocket URL:', url)
  ws.value = new WebSocket(url)
  ws.value.onopen = () => {
    console.log('WebSocket connection opened')
  }
  ws.value.onmessage = (event) => {
    handelResultMessage(event.data)
  }
  ws.value.onclose = () => {
    connectWebSocket()
  }
  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

let tempMessage = {
  role: '',
  content: ''
}

const handelResultMessage = (message) => {
  message = JSON.parse(message)
  console.log(message)

  const { str, role } = getMessage(message)
  console.log(str, role)

  tempMessage.role = role
  tempMessage.content += str

  switch (message.header.status) {
    case 0:
      messages.value.push({ ...tempMessage })
      break
    case 1:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      break
    default:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      console.log(tempMessage)
      tempMessage = {
        role: '',
        content: ''
      }
      break
  }
}

const getMessage = (message) => {
  try {
    const str = message.payload.choices.text[0].content
    const role = message.payload.choices.text[0].role
    return { str, role }
  } catch (e) {
    console.error('大模型响应的数据是错误的' + e)
  }
}

let sendMessagePayload = {
  header: {
    app_id: APP_ID,
    uid: '39769795890'
  },
  parameter: {
    chat: {
      domain: 'general',
      temperature: 0.5,
      top_k: 4,
      max_tokens: 2028,
      auditing: 'default'
    }
  },
  payload: {
    message: {
      text: []
    }
  }
}

const sendMessage = () => {
  if (question.value || imgBase64.value) {
    const newMessage = []
    messages.value.forEach((e) => {
      newMessage.push(e)
    })

    if (imgBase64.value) {
      newMessage.push({
        role: 'user',
        content: imgBase64.value,
        content_type: 'image'
      })
    }

    if (question.value) {
      newMessage.push({
        role: 'user',
        content: question.value,
        content_type: 'text'
      })
      resetInputData()
      messages.value = newMessage
    }

    sendMessagePayload.payload.message.text = newMessage
    console.log(sendMessagePayload)
    ws.value.send(JSON.stringify(sendMessagePayload))
  } else {
    console.log('你没有提问或选择图片。')
  }
}

const handleFileChange = (event) => {
  convertBase64(event)
    .then((base64String) => {
      imgBase64.value = base64String
    })
    .catch((error) => {
      console.error('文件读取错误:', error)
    })
}

const resetInputData = () => {
  question.value = ''
  imgBase64.value = ''
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef is not set')
  }
}

// 录音函数
const voiceRecognizer = new VoiceRecognizer()
const isRecording = ref(false)
const startRecording = () => {
  if (isRecording.value) {
    // 停止录音
    voiceRecognizer.stop()
    isRecording.value = false
  } else {
    // 开始录音
    voiceRecognizer.start()
    voiceRecognizer.onResult = (result) => {
      question.value += result
    }
    isRecording.value = true
  }
}

onMounted(() => {
  generateAuthParams()
  connectWebSocket()
})
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
