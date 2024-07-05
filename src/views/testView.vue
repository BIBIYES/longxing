<template>
  <div class="chat-container">
    <div class="chat-box markdown-body" ref="chatBox">
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
          v-if="imgBase64"
          :src="`data:image/png;base64,${imgBase64}`"
          alt="Uploaded Image"
          class="uploaded-image"
        />
        </template>
      </div>
    </div>
    <div class="input-box">
      <div class="input-container">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileChange"
          accept="image/*"
        />
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
import { ref, onMounted } from 'vue'
import CryptoJS from 'crypto-js'

const APPID = 'c3fbc474'
const APIKey = 'f53a5d5b29d3b8c0770b3b51224dbab9'
const APISecret = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz'
const host = 'spark-api.cn-huabei-1.xf-yun.com'
const date = ref(null)
const authorization = ref(null)
const ws = ref(null)
const fileData = ref(null)
const question = ref('')
const imgBase64 = ref('')
// 存储消息的变量
const messages = ref([])
const generateAuthParams = () => {
  // Generate the date string
  const curTime = new Date()
  date.value = curTime.toUTCString()

  // Create the tmp string for signature
  const tmp = `host: ${host}\ndate: ${date.value}\nGET /v2.1/image HTTP/1.1`

  // Generate the HMAC-SHA256 signature
  const tmpSha = CryptoJS.HmacSHA256(tmp, APISecret)
  const signature = CryptoJS.enc.Base64.stringify(tmpSha)

  // Create the authorization string
  const authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`

  // Base64 encode the authorization string
  authorization.value = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationOrigin)
  )
}
// 连接websocket
const connectWebSocket = () => {
  const url = `wss://${host}/v2.1/image?authorization=${encodeURIComponent(
    authorization.value
  )}&date=${encodeURIComponent(date.value)}&host=${encodeURIComponent(host)}`
  console.log('WebSocket URL:', url)
  ws.value = new WebSocket(url)
  ws.value.onopen = () => {
    console.log('WebSocket connection opened')
  }
  ws.value.onmessage = (event) => {
    handelResultMessage(event.data)
  }
  // ws.value.onclose = () => {
  //   console.log('WebSocket connection closed')
  // }
  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}
/**
 * 保存消息将消息保存到聊天对象中
 * 聊天对象包含所有聊天消息
 * 页面上的数据也是用聊天对象中获取
 * 无法是发送消息，接受消息都要把他保存在聊天对象中
 * 形成聊天记录
 */
const saveMessages = (message) => {
  messages.value.push(message)
}
// 消息模板
let tempMessage = {
  role: '',
  content: ''
}

// 处理返回消息
const handelResultMessage = (message) => {
  message = JSON.parse(message)
  console.log(message)

  const { str, role } = getMessage(message)
  console.log(str, role)

  tempMessage.role = role
  tempMessage.content += str

  switch (message.header.status) {
    case 0:
      // 创建一个新的聊天
      messages.value.push({ ...tempMessage })
      break
    case 1:
      // 中间消息
      messages.value[messages.value.length - 1] = { ...tempMessage }
      break
    default:
      // 结束消息
      messages.value[messages.value.length - 1] = { ...tempMessage }
      console.log(tempMessage)
      // 初始化缓存
      tempMessage = {
        role: '',
        content: ''
      }
      break
  }
}
// 解析消息
const getMessage = (message) => {
  const str = message.payload.choices.text[0].content
  const role = message.payload.choices.text[0].role
  return { str, role }
}

// 发送消息载荷
let sendMessagePayload = {
  header: {
    app_id: APPID,
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
      text: [
        // 像这样把消息添加到这里面来
        // {
        //   role: 'user',
        //   content: base64String,
        //   content_type: 'image'
        // },
        // {
        //   role: 'user',
        //   content: question.value,
        //   content_type: 'text'
        // }
      ]
    }
  }
}

const sendMessage = () => {
  if (question.value || imgBase64.value) {
    const newMessage = []

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
      // 将消息储存到聊天对象中
      newMessage.forEach((message) => {
        saveMessages(message) // 假设这里是保存消息的逻辑
      })
    }

    sendMessagePayload.payload.message.text = newMessage
    console.log(sendMessagePayload)
    ws.value.send(JSON.stringify(sendMessagePayload))
  } else {
    console.log('你没有提问或选择图片。')
  }
}

const handleFileChange = (event) => {
  fileData.value = event.target.files[0]
  console.log('Selected file:', fileData.value)

  const reader = new FileReader()
  reader.onload = (event) => {
    // 获取完整的 base64 编码
    const fullBase64 = event.target.result

    // 去掉头部信息，只保留编码部分
    const base64WithoutHeader = fullBase64.split(';base64,').pop()

    // 存储到 imgBase64
    imgBase64.value = base64WithoutHeader
  }
  reader.readAsDataURL(fileData.value)
}

onMounted(() => {
  generateAuthParams()
  connectWebSocket()
})
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

.assistant {
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
.chat-box img{
  width: 200px;
  border-radius: 10px;
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
