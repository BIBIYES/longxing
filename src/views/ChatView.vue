<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import CryptoJS from 'crypto-js'
import { convertBase64 } from '@/utils/imgBase64Util'
import VoiceRecognizer from '@/utils/VoiceRecognizer'
import { useSessionStore } from '@/stores/sessionStore'
import TextImageUtil from '@/utils/textImageUtil'
// 消息格式化
import {convertToHtml} from '@/utils/ContenFormat'
import 'highlight.js/styles/foundation.css'
// 常量定义
const APP_ID = 'c3fbc474'
const API_KEY = 'f53a5d5b29d3b8c0770b3b51224dbab9'
const API_SECRET = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz'
const HOST = 'spark-api.xf-yun.com'

// 引用和响应式变量定义
const date = ref(null)
const authorization = ref(null)
const ws = ref(null)
const question = ref('')
const imgBase64 = ref('')
const messages = ref([])
const fileInputRef = ref(null)
const isRecording = ref(false)
const route = useRoute()
const sessionId = ref(route.params.id)
const SessionStore = useSessionStore()
const voiceRecognizer = new VoiceRecognizer()
// 语音动画控制器
const isVoiceLoading = ref(false)
// 发送动画控制器
const isSendLoading = ref(false)

// 获取历史消息
const getHistoricalMessages = () => {
  const session = SessionStore.getSessionById(sessionId.value)
  if (session) {
    messages.value = session.messages
    console.log('获取历史数据成功')
  } else {
    console.error(`未找到会话ID为${sessionId.value}的会话.`)
  }
}

// 生成WebSocket连接URL
const generateAuthParams = () => {
  const curTime = new Date()
  date.value = curTime.toUTCString()

  const tmp = `host: ${HOST}\ndate: ${date.value}\nGET /v3.5/chat HTTP/1.1`
  const tmpSha = CryptoJS.HmacSHA256(tmp, API_SECRET)
  const signature = CryptoJS.enc.Base64.stringify(tmpSha)

  const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  authorization.value = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationOrigin)
  )
}

// 连接WebSocket方法
const connectWebSocket = () => {
  const url = `wss://${HOST}/v3.5/chat?authorization=${encodeURIComponent(
    authorization.value
  )}&date=${encodeURIComponent(date.value)}&host=${encodeURIComponent(HOST)}`
  console.log('WebSocket URL:', url)
  ws.value = new WebSocket(url)
  ws.value.onopen = () => {
    console.log('WebSocket connection opened')
  }
  ws.value.onmessage = (event) => {
    handleResultMessage(event.data)
  }
  ws.value.onclose = () => {
    connectWebSocket()
  }
  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

// 响应缓存消息
let tempMessage = {
  role: '',
  content: ''
}

// 处理返回消息方法
const handleResultMessage = (message) => {
  message = JSON.parse(message)

  const { str, role } = getMessage(message)

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
      SessionStore.addChatRecord(sessionId.value, messages)
      handelIsSendLoading()
      tempMessage = {
        role: '',
        content: ''
      }
      break
  }
}

// 获取响应消息具体信息
const getMessage = (message) => {
  try {
    const str = message.payload.choices.text[0].content
    const role = message.payload.choices.text[0].role
    return { str, role }
  } catch (e) {
    console.error('大模型响应的数据是错误的' + e)
  }
}

// 发送消息载荷
const sendMessagePayload = {
  header: {
    app_id: APP_ID,
    uid: '12345'
  },
  parameter: {
    chat: {
      domain: 'generalv3.5',
      temperature: 0.5,
      max_tokens: 1024
    }
  },
  payload: {
    message: {
      text: []
    }
  }
}

// 发送消息方法
const sendMessage = () => {
  // 发送消息动画切换器
  handelIsSendLoading()
  if (imgBase64.value) {
    //如果有图片则是调用图片识别api
    console.log('检测到图片正在调用图片识别api')
    sendImgMessage()
  } else {
    if (question.value) {
      console.log('执行普通大模型调用')
      // 加载历史消息 并过滤掉content_type = image的
      const newMessage = messages.value.filter(
        (msg) => msg.content_type !== 'image'
      )
      newMessage.push({
        role: 'user',
        content: question.value,
        content_type: 'text'
      })
      resetInputData()
      messages.value = newMessage
      sendMessagePayload.payload.message.text = newMessage

      ws.value.send(JSON.stringify(sendMessagePayload))
    } else {
      console.warn('你没有提问或选择图片。')
    }
  }
}
// 图片理解接口

const textImageUtil = new TextImageUtil()

const handleWebSocketMessage = (data) => {
  data = JSON.parse(data)

  const { content, role } = data.payload.choices.text[0]
  const status = data.header.status

  tempMessage.role = role
  tempMessage.content += content

  switch (status) {
    case 0:
      messages.value.push({ ...tempMessage })
      break
    case 1:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      break
    default:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      console.log('动画切换器切换器关闭')
      handelIsSendLoading()
      tempMessage = {
        role: '',
        content: ''
      }
      break
  }
}

const handleWebSocketError = (error) => {
  console.error('WebSocket error:', error)
}

textImageUtil.setOnMessageCallback(handleWebSocketMessage)
textImageUtil.setOnErrorCallback(handleWebSocketError)

const sendImgMessage = () => {
  if (question.value || imgBase64.value) {
    messages.value.push({
      role: 'user',
      content: imgBase64.value,
      content_type: 'image'
    })
    messages.value.push({
      role: 'user',
      content: question.value,
      content_type: 'text'
    })
    textImageUtil.sendMessage(question.value, imgBase64.value)
    question.value = ''
    imgBase64.value = ''
  } else {
    console.log('你没有提问或选择图片。')
  }
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
// 发送消息动画控制器
const handelIsSendLoading = () => {
  if (isSendLoading.value == false) {
    isSendLoading.value = true
    console.log('动画切换器开启')
  } else {
    isSendLoading.value = false // 修复错别字
    console.log('动画切换器关闭')
  }
}
// 重置输入框
const resetInputData = () => {
  question.value = ''
  imgBase64.value = ''
}

// 触发文件输入
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef 未设置')
  }
}

// 录音控制
const startRecording = () => {
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

// 生命周期钩子
onMounted(() => {
  generateAuthParams()
  connectWebSocket()
  getHistoricalMessages()
})

// 监听路由变化
watch(route, (newRoute) => {
  sessionId.value = newRoute.params.id
  getHistoricalMessages()
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
          <div v-html="convertToHtml( msg.content )"></div>
        </template>
        <template v-else-if="msg.content_type === 'text'">
          <p>{{ msg.content }}</p>
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
            <TextLoading v-if="isSendLoading"></TextLoading>
            <img src="../assets/img/发送.png" alt="Send Icon" v-else />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '/src/assets/main.css/ChatView.less';
@import '/src/assets/css/foundation.css';
</style>

