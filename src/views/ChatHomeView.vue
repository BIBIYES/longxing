<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Typed from 'typed.js'
import { generateUUID } from '@/utils/uuid'
import { convertBase64 } from '@/utils/imgBase64Util'

const textareaRef = ref(null)
const typewriterElement = ref(null)
let typed = null
const question = ref('')
const router = useRouter()
let imgBase64 = ref('')
const fileInputRef = ref(null)
const sessionStore = useSessionStore()

// 发送消息的函数
const sendMessage = () => {
  const uuid = generateUUID()
  console.log("生成了一个uuid " + uuid)
  // 创建一个消息
  sessionStore.createNewMessage(uuid, question.value)
  if(question){
    router.push({ name: 'chat', params: { id: uuid }, query: { question: question.value } });
  }
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
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  box-sizing: border-box;

  .title-box {
    width: 100%;
    text-align: center;
    padding: 20px 0;
    border-bottom: 2px solid #e0e0e0;

    h1 {
      height: 50px;
      margin: 0;
      font-size: 24px;
      color: #2c3e50;
    }

    p {
      font-size: 16px;
      color: #7f8c8d;
    }
  }

  .content-box {
    width: 100%;
    flex: 1;
    padding: 20px 0;
    box-sizing: border-box;

    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .item {
      width: calc(50% - 40px);
      padding: 20px;
      margin: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      background-color: #fff;
      text-align: center;
      box-sizing: border-box;

      .title {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;

        img {
          width: 24px;
          height: 24px;
          margin-right: 10px;
        }

        span {
          font-size: 18px;
          font-weight: bold;
        }
      }
    }
  }
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
