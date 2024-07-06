<template>
  <div class="chat-container">
    <div class="chat-box markdown-body" ref="chatBox">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
        v-html="msg.role === 'ai' ? marked(msg.content) : msg.content"
      ></div>
    </div>
    <div class="input-box">
      <div class="input-container">
        <img
          src="../assets/img/录音.png"
          alt="Attachment Icon"
          class="icon"
          @click="startRecording"
        />
        <textarea
          ref="textareaRef"
          id="inputTextarea"
          rows="1"
          placeholder="给“龙萌说些什么”发送消息"
          @input="adjustHeight"
          v-model="question"
        ></textarea>
        <img
          src="../assets/img/发送.png"
          alt="Send Icon"
          class="send-icon"
          @click="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { useSessionStore } from '@/stores/sessionStore'
import { useRouter, useRoute } from 'vue-router'
import 'github-markdown-css/github-markdown.css'

const router = useRouter()
const sessionStore = useSessionStore()
const route = useRoute()
const question = ref('')
const messages = ref([])
const chatBox = ref(null)
const textareaRef = ref(null)

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
        role: 'ai',
        content: ''
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
    content_type: 'text'
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
// 语音输入相关代码
import '/src/voice-utils/utilJS/crypto-js.js' //鉴权的引用地址
import '/src/voice-utils/utilJS/index.umd.js' // 调用Web Speech API 的依赖，应该是官方的写的工具类
const btnText = ref('开始录音')
const btnStatus = ref('UNDEFINED') // "UNDEFINED" "CONNECTING" "OPEN" "CLOSING" "CLOSED"
const recorder = new RecorderManager('/src/voice-utils/dist')
const APPID = 'c3fbc474' // TODO 你的讯飞模型APPID
const API_SECRET = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz' // TODO 你的讯飞模型API_SECRET
const API_KEY = 'f53a5d5b29d3b8c0770b3b51224dbab9' // TODO 你的讯飞模型API_KEY
let iatWS //监听录音的变量
let resultText = ref('') // 识别结果
let resultTextTemp = ref('')
let countdownInterval
// 生成 WebSocket URL 生成规则由平台决定
function getWebSocketUrl() {
  // 请求地址根据语种不同变化
  var url = 'wss://iat-api.xfyun.cn/v2/iat'
  var host = 'iat-api.xfyun.cn'
  var apiKey = API_KEY
  var apiSecret = API_SECRET
  var date = new Date().toGMTString()
  var algorithm = 'hmac-sha256'
  var headers = 'host date request-line'
  var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
  var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  var signature = CryptoJS.enc.Base64.stringify(signatureSha)
  var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  var authorization = btoa(authorizationOrigin)
  url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
  return url
}
// 加密工具函数
function toBase64(buffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
// 计数函数
function countdown() {
  let seconds = 60
  btnText.value = `录音中（${seconds}s）`
  countdownInterval = setInterval(() => {
    seconds = seconds - 1
    if (seconds <= 0) {
      clearInterval(countdownInterval)
      recorder.stop()
    } else {
      btnText.value = `录音中（${seconds}s）`
    }
  }, 1000)
}
// 录音状态变化函数
function changeStatus(status) {
  btnStatus.value = status
  if (status === 'CONNECTING') {
    btnText.value = '建立连接中'
    resultText.value = ''
    resultTextTemp.value = ''
  } else if (status === 'OPEN') {
    countdown()
  } else if (status === 'CLOSING') {
    btnText.value = '关闭连接中'
  } else if (status === 'CLOSED') {
    btnText.value = '开始录音'
  }
}
// 结果解析函数
function renderResult(resultData) {
  let jsonData
  try {
    jsonData = JSON.parse(resultData)
  } catch (error) {
    console.error('Failed to parse result data', resultData)
    return
  }

  if (jsonData.data && jsonData.data.result) {
    let data = jsonData.data.result
    let str = data.ws.map((item) => item.cw[0].w).join('')
    if (data.pgs) {
      if (data.pgs === 'apd') {
        resultText.value = resultTextTemp.value
      }
      resultTextTemp.value = resultText.value + str
    } else {
      resultText.value = resultText.value + str
    }
    adjustHeight()
    question.value = resultText.value // 更新输入框中的内容
  }

  if (jsonData.code === 0 && jsonData.data.status === 2) {
    iatWS.close()
  }

  if (jsonData.code !== 0) {
    iatWS.close()
    console.error(jsonData)
  }
}
// 连接 WebSocket
function connectWebSocket() {
  const websocketUrl = getWebSocketUrl()
  if ('WebSocket' in window) {
    iatWS = new WebSocket(websocketUrl)
  } else if ('MozWebSocket' in window) {
    iatWS = new MozWebSocket(websocketUrl)
  } else {
    alert('浏览器不支持WebSocket')
    return
  }
  changeStatus('CONNECTING')
  iatWS.onopen = (e) => {
    recorder.start({
      sampleRate: 16000,
      frameSize: 1280
    })
    var params = {
      common: {
        app_id: APPID
      },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 5000,
        dwa: 'wpgs'
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw'
      }
    }
    iatWS.send(JSON.stringify(params))
  }
  iatWS.onmessage = (e) => {
    renderResult(e.data)
  }
  iatWS.onerror = (e) => {
    console.error(e)
    recorder.stop()
    changeStatus('CLOSED')
  }
  iatWS.onclose = (e) => {
    recorder.stop()
    changeStatus('CLOSED')
  }
}
// 定义监听开始的函数
recorder.onStart = () => {
  changeStatus('OPEN')
}
// 处理回调的结果
recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
  if (iatWS.readyState === iatWS.OPEN) {
    iatWS.send(
      JSON.stringify({
        data: {
          status: isLastFrame ? 2 : 1,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: toBase64(frameBuffer)
        }
      })
    )
    if (isLastFrame) {
      changeStatus('CLOSING')
    }
  }
}
// 停止录音的处理
recorder.onStop = () => {
  clearInterval(countdownInterval)
}
// 按钮点击的启动 | 结束函数
const startRecording = () => {
  if (btnStatus.value === 'UNDEFINED' || btnStatus.value === 'CLOSED') {
    connectWebSocket()
  } else if (btnStatus.value === 'CONNECTING' || btnStatus.value === 'OPEN') {
    recorder.stop()
  }
}
</script>

<style scoped>
@import 'github-markdown-css/github-markdown.css';

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
  margin: auto;
  box-sizing: border-box;
}

.title-box {
  width: 100%;
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px solid #e0e0e0;
}

.title-box h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

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
}

.user {
  align-self: flex-end;
  background-color: #dcf8c6;
  border-radius: 10px 10px 0 10px;
}

.ai {
  align-self: flex-start;
  background-color: #f1f0f0;
  border-radius: 10px 10px 10px 0;
}

.message .content {
  font-size: 16px;
  color: #333;
}

.message .timestamp {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.chat-box {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  padding: 40px;
  padding-left: 100px;
  border-radius: 10px;
  padding-right: 100px;
}

.input-box {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #fff;
}

.input-box .input {
  width: 600px;
  border-radius: 20px;
  background-color: rgb(244, 244, 244);
  overflow: hidden;
  display: flex;
  align-items: end;
  padding: 12px;
  box-sizing: border-box;
}

.input-box .input textarea {
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
}

.send {
  width: 29px;
  height: 29px;
  border-radius: 50px;
  background-color: rgb(0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.send img {
  width: 100%;
}

.input-container {
  width: 50%;
  display: flex;
  align-items: flex-end;

  border-radius: 50px;
  padding: 10px 20px;
  background-color: #f5f5f5;
  position: relative;
}

.input-container textarea {
  max-height: 300px;
  border: none;
  outline: none;
  flex-grow: 1;
  background: none;
  font-size: 16px;
  resize: none;
  overflow: hidden;
  min-height: 23px;
}

.input-container .icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  background-color: black;
  border-radius: 50px;
}

.input-container .send-icon {
  width: 30px;
  height: 30px;
  margin-left: 10px;
  border-radius: 50px;
  background-color: black;
}
</style>
