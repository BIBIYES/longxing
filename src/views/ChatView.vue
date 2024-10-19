<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { convertBase64 } from '@/utils/imgBase64Util'
import { useSessionStore } from '@/stores/sessionStore'
import TextImageUtil from '@/utils/textImageUtil'
import { XfVoiceDictation } from '@muguilin/xf-voice-dictation'
// 消息格式化
import { convertToHtml } from '@/utils/ContenFormat'
import 'github-markdown-css/github-markdown.css'
import { fastgpt } from '@/utils/FastGpt';
import { success, warning } from '../utils/messageUtil'
const { isLoading, error, results, sendQuestion } = fastgpt();
// 实例化
const route = useRoute()
const router = useRouter()
const SessionStore = useSessionStore()
// 输入框用户的问题
const question = ref(null)
// 图片的Base64信息
const imgBase64 = ref('')
// 聊天记录
const messages = ref([])
// 文件
const fileInputRef = ref(null)
// 在录音吗？
const isRecording = ref(false)
//当前页面会话id
const sessionId = ref(route.params.id)
// 语音动画控制器
const isVoiceLoading = ref(false)
// 发送动画控制器
const isSendLoading = ref(false)
// 聊天盒子获取
const chatBox = ref(null)
// 输入框
const textareaRef = ref(null)
const placeholderText = ref('给"龙梦说些什么"(shift+enter换行)')
// 获取历史消息
const getHistoricalMessages = () => {
  const session = SessionStore.getSessionById(sessionId.value)
  if (session) {
    messages.value = session.messages
  } else {
    console.error(`未找到会话ID为${sessionId.value}的会话.`)
  }
}


const handleSendQuestion = () => {
  const params = {
    chatId: route.params.id,
    variables: {
      uid: route.params.id,
      name: '张三'
    },
    messages: [
      {
        role: 'user',
        content: question.value
      }
    ],
    onData: (json) => {
      toggleStatusLamp(false)
      // console.log(json);
      // ai消息拼接
      // 判断消息状态
      if (json.choices[0].finish_reason == null) {
        messages.value[messages.value.length - 1].content += json.choices[0].delta.content
        // console.log(json.choices[0].delta.content);
        scrollToBottom()
      } else {
        isSendLoading.value = false
        // 切换状态灯

      }
    }
  };
  sendQuestion(params);
};
const showStatusLamp = ref(false);  // 初始值为显示状态灯
// 切换状态灯的方法
const toggleStatusLamp = (status) => {
  showStatusLamp.value = status
};
// 发送消息方法
const sendMessage = () => {
  if (imgBase64.value) {
    isSendLoading.value = true
    sendImgMessage()
  } else {
    if (question.value && question.value != ' ') {
      // 开启发送动画
      isSendLoading.value = true
      // 将消息添加到用户队列中
      messages.value.push({
        role: "user",
        content: question.value,
        content_type: "text"
      })
      // 添加一个空ai消息
      messages.value.push({
        role: "assistant",
        content: "",
        content_type: "text"
      })
      // 知识库搜索
      toggleStatusLamp(true)
      handleSendQuestion()
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
      isSendLoading.value = false
      SessionStore.addChatRecord(sessionId.value, messages.value)
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
    nextTick(() => {
      scrollToBottom()
    })
  } else {
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
  } else {
    isSendLoading.value = false // 修复错别字
  }
}

// 录音动画控制器
const handelIsVoiceLoading = () => {
  if (isVoiceLoading.value) {
    isVoiceLoading.value = false
  } else {
    isVoiceLoading.value = true
  }
}
// 重置输入框
const resetInputData = () => {
  question.value = null
  imgBase64.value = null
}

// 触发文件输入
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  } else {
    console.error('fileInputRef 未设置')
  }
}

// 语音识别
let times = null

// 实例化迅飞语音听写（流式版）WebAPI
const originalConsoleLog = console.log
console.log = function () { }
const xfVoice = new XfVoiceDictation({
  APPID: 'c3fbc474',
  APISecret: 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz',
  APIKey: 'f53a5d5b29d3b8c0770b3b51224dbab9',

  onWillStatusChange: function (oldStatus, newStatus) { },

  onTextChange: function (text) {
    question.value = text

    if (text) {
      clearTimeout(times)
      times = setTimeout(() => xfVoice.stop(), 3000)
    }
  },

  onError: function (error) { }
})
console.log = originalConsoleLog
// 录音控制
const startRecording = () => {
  // 动画切换器
  handelIsVoiceLoading()
  if (isRecording.value) {
    // 关闭语音识别
    xfVoice.stop()
    placeholderText.value = '给“龙梦说些什么”发送消息'
    isRecording.value = false
  } else {
    xfVoice.start()
    placeholderText.value = '龙梦正在听.....'
    // 开始语音识别
    isRecording.value = true
  }
}

// 输入框自适应
const adjustHeight = () => {
  const textarea = textareaRef.value
  textarea.style.height = 'auto' // Reset height to auto to calculate new height
  textarea.style.height = textarea.scrollHeight + 'px' // Set new height based on scrollHeight
}
watch(question, (newValue, oldValue) => {
  adjustHeight()
})
// 处理键盘事件
const handleKeyUp = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault() // 阻止默认的换行行为
    if (question.value.trim() !== '') {
      // 仅在输入框不为空时发送消息
      sendMessage()
      resetInputData()
      nextTick(() => {
        adjustHeight()
      })
    }
  }
}
// 终止会话
const terminateSession = () => {
  if (ws.value) {
    ws.value.close()
    ws.value = null
    // 关闭发送动画
    handelIsSendLoading()
  }
}
// 解析url
const parseUrl = () => {
  if (route.query.question) {
    if (route.query.imgBase64) {
      imgBase64.value = route.query.imgBase64
      question.value = route.query.question
      sendMessage()
      nextTick(() => {
        router.replace({ query: null })
      })
      return
    }
    question.value = route.query.question
    sendMessage()
    nextTick(() => {
      router.replace({ query: null })
    })
  }
}
// 生命周期钩子
onMounted(async () => {
  // 获取历史聊天记录
  getHistoricalMessages()
  parseUrl()
  nextTick(() => {
    scrollToBottom()
  })
})

// 监听路由变化
watch(route, (newRoute) => {
  sessionId.value = newRoute.params.id
  getHistoricalMessages()
})
// 页面滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) {
      chatBox.value.scrollTop = chatBox.value.scrollHeight
    }
  })
}


const sendWarning = ()=>{
  warning("警告","fastgpt版本在目前版本下不支持上传文件")
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-messages markdown-body" ref="chatBox">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
        <template v-if="msg.role === 'assistant'">
          <div v-html="convertToHtml(msg.content)"></div>
          <div class="text-with-status" v-if="index === messages.length - 1 && showStatusLamp">
            <span class="status-lamp"></span>
            <span>知识库搜索中....</span>
          </div>
        </template>
        <template v-else-if="msg.content_type === 'text'">
          <p style="margin-bottom: 0">{{ msg.content }}</p>
        </template>
        <template v-else-if="msg.content_type === 'image'">
          <img :src="`data:image/png;base64,${msg.content}`" alt="Uploaded Image" class="message-image" />
        </template>
      </div>
    </div>
    <div class="input-container">
      <div class="input-section">
        <div class="image-preview" v-show="imgBase64">
          <el-image style="width: 100px; height: 100%" :src="`data:image/png;base64,${imgBase64}`" />
        </div>
        <div class="input-controls">
          <input type="file" @change="handleFileChange" accept="image/*" style="display: none" ref="fileInputRef"/>
          <div class="icon icon-upload" @click="sendWarning">
            <!-- <img src="../assets/img/上传.png" alt="Upload Icon" /> -->
            <el-icon :size="28">
              <UploadFilled />
            </el-icon>
          </div>
          <div class="icon icon-record" @click="startRecording">
            <VoiceLoading v-if="isVoiceLoading"></VoiceLoading>
            <el-icon v-else :size="23">
              <Microphone />
            </el-icon>
            <!-- <img src="../assets/img/录音.png" alt="Recording Icon"  /> -->
          </div>
          <textarea ref="textareaRef" id="inputTextarea" rows="1" :placeholder="placeholderText" @input="adjustHeight"
            @keyup="handleKeyUp" v-model="question"></textarea>
          <div class="icon icon-send">
            <TextLoading v-if="isSendLoading" @click="terminateSession()"></TextLoading>
            <img src="../assets/img/send-alt-svgrepo-com.svg" alt="Send Icon" @click="sendMessage" v-else />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '/src/assets/css/main/ChatView.less';

@keyframes breathing {
  0% {
    opacity: 1;
    box-shadow: 0 0 5px 2px rgba(0, 128, 0, 0.9); // 更深的绿色阴影
  }

  50% {
    opacity: 0.5;
    box-shadow: 0 0 10px 5px rgba(0, 128, 0, 0.6); // 更高的透明度
  }

  100% {
    opacity: 1;
    box-shadow: 0 0 5px 2px rgba(0, 128, 0, 0.9); // 返回到初始状态
  }
}

.status-lamp {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #008000; // 更深的绿色
  margin-right: 10px;
  animation: breathing 2s infinite;
  display: inline-block;
}

.text-with-status {
  display: flex;
  align-items: center;
  font-family: 'Roboto', Arial, sans-serif;
  /* 设置更现代的字体 */
  color: #333;
  /* 深灰色字体，显得更加简洁优雅 */
  font-size: 16px;
  /* 调整字体大小 */
}
</style>
