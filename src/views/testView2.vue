<script setup>
import { ref, onMounted } from 'vue'
import { convertBase64 } from '@/utils/imgBase64Util'
import VoiceRecognizer from '@/utils/VoiceRecognizer'
import TextImageUtil from '@/utils/textImageUtil'

let question = ref('')
let imgBase64 = ref('')
const messages = ref([])
const fileInputRef = ref(null)
const isRecording = ref(false)
const textLoading = ref(false)
let tempMessage = {
  role: '',
  content: ''
}
// 图片理解
const textImageUtil = new TextImageUtil()

const handleWebSocketMessage = (data) => {
  data = JSON.parse(data)
  console.log(data)
  const { content, role } = data.payload.choices.text[0]
  const status = data.header.status
  console.log(content)

  tempMessage.role = role
  tempMessage.content += content

  switch (
    status // Corrected 'message.header.status' to 'status'
  ) {
    case 0:
      messages.value.push({ ...tempMessage })
      console.log('创建会话')
      break
    case 1:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      console.log('中途会话')
      break
    default:
      messages.value[messages.value.length - 1] = { ...tempMessage }
      console.log('结束会话')
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

const sendMessage = () => {
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

const handleFileChange = async (event) => {
  try {
    imgBase64.value = await convertBase64(event)
  } catch (error) {
    console.error('File read error:', error)
  }
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef is not set')
  }
}

const voiceRecognizer = new VoiceRecognizer()
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

onMounted(() => {
  // WebSocket connection is already initialized in the script setup
})
</script>

<template>
  <div class="chat-container">
    <div class="chat-messages markdown-body" ref="chatBox">
      <TextLoading> </TextLoading>
      <VoiceLoading></VoiceLoading>
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
            <img src="../assets/img/录音.png" alt="Recording Icon" v-if="isRecording"/>
            <VoiceLoading v-else></VoiceLoading>
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
            
            <img src="../assets/img/发送.png" alt="Send Icon" v-if="textLoading"/>
            <TextLoading v-else></TextLoading>
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
