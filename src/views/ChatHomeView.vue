<template>
  <div class="container">
    <div class="title-box">
      <h1 ref="typewriterElement">你好,我是龙梦GPT🐉</h1>
      <p>你好，我是龙梦，今天我能帮你什么？</p>
    </div>
    <div class="content-box">
      <div class="row">
        <div class="item">
          <div class="title">
            <img src="../assets/img/编辑.png" alt="" />
            <span>文本创作</span>
          </div>
          <p>创作更生动、更引人入胜</p>
        </div>
        <div class="item">
          <div class="title">
            <img src="../assets/img/日历.png" alt="" />
            <span>制定计划</span>
          </div>
          <p>创意策划助推：发掘潜能与无限可能</p>
        </div>
      </div>
      <div class="row">
        <div class="item">
          <div class="title">
            <img src="../assets/img/灵感.png" alt="" />
            <span>创意灵感</span>
          </div>
          <p>创意策划助推：发掘潜能与无限可能</p>
        </div>
        <div class="item">
          <div class="title">
            <img src="../assets/img/代码.png" alt="" />
            <span>代码审查</span>
          </div>
          <p>代码质量把关：审查意见与优化建议</p>
        </div>
      </div>
    </div>
    <!-- <div class="input-box">
      <div class="input">
        <div class="voice-controls">
          <button @click="startRecording()">
            {{ btnText }}
          </button>
        </div>
        <textarea
          id="inputTextarea"
          placeholder="输入/唤起指令中心, Shift+Enter换行, 点击左侧上传按钮传文件"
          v-model="question"
        ></textarea>
        <div class="send" @click="sendMessage">
          <img src="../assets/img/025-发送.png" alt="发送" />
        </div>
      </div>
    </div> -->
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
          id="input"
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
import { useSessionStore } from '@/stores/sessionStore'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Typed from 'typed.js'
const textareaRef = ref(null)
const typewriterElement = ref(null)
let typed = null

const sessionStore = useSessionStore()
const router = useRouter()
const question = ref('')

const sendMessage = async () => {
  if (!question.value.trim()) return

  const newSession = {
    id: Date.now(),
    title: question.value,
    messages: []
  }

  sessionStore.addSession(newSession)
  question.value = ''

  router.push({
    path: `/chat/${newSession.id}`,
    query: { question: newSession.title }
  })
}

onMounted(() => {
  // 初始化typed.js实例
  typed = new Typed(typewriterElement.value, {
    strings: [
      '你好，我是龙梦助手',
      '一个运行在龙芯平台的多元化GPT',
      '龙梦助手Chat'
    ],
    // 打字速度
    typeSpeed: 100,
    // 退格速度
    backSpeed: 20,
    // 是否循环
    loop: false,
    showCursor: false
  })
})

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
// 输入框自适应
const adjustHeight = () => {
  const textarea = textareaRef.value
  textarea.style.height = 'auto' // Reset height to auto to calculate new height
  textarea.style.height = textarea.scrollHeight + 'px' // Set new height based on scrollHeight
}


</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  box-sizing: border-box;
}

.title-box {
  width: 100%;
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px solid #e0e0e0;
}

.title-box h1 {
  height: 50px;
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.title-box p {
  font-size: 16px;
  color: #7f8c8d;
}

.content-box {
  width: 100%;
  flex: 1;
  padding: 20px 0;
  box-sizing: border-box;
}

.content-box .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.content-box .item {
  width: calc(50% - 40px);
  padding: 20px;
  margin: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #fff;
  text-align: center;
  box-sizing: border-box;
}

.content-box .item .title {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.content-box .item .title img {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.content-box .item .title span {
  font-size: 18px;
  font-weight: bold;
}

.input-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  margin-bottom: 10px;
}

.input-box .input textarea {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  width: 100%;
  max-height: 150px; /* 设置最大高度 */
  height: auto;
  border: none;
  outline: none;
  background: none;
  resize: none;
  padding: 0;
  box-sizing: border-box;
  overflow-y: auto; /* 允许垂直滚动 */
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

.voice-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.voice-controls button {
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 10px;
}

.voice-controls button:hover {
  background-color: #2980b9;
}

.voice-controls p {
  font-size: 16px;
  color: #2c3e50;
}
/* 新输入框样式  */
.input-container {
  width: 50%;
  display: flex;
  align-items: flex-end; /* Align items to the bottom */
  border: 1px solid #ddd;
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
  resize: none; /* Prevent textarea from being resized manually */
  overflow: hidden; /* Hide overflow to make textarea grow in height */
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
  /* opacity: 0.5; */
  border-radius: 50px;
  background-color: black;
}
</style>
