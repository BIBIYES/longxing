<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useImageStore } from '@/stores/useImageStore.js'
import { warning, error } from '@/utils/messageUtil.js'

const imageStore = useImageStore()

// Define width and height
const height = ref(null)
const width = ref(null)

// Loading animation controller
const loading = ref(false)

// 浏览器保存imageData的图片
const handleSave = () => {
  if (!imageData.value) {
    console.error('没有图片数据可以保存')
    return
  }

  // 创建一个a元素
  const link = document.createElement('a')
  link.href = imageData.value
  link.download = 'image.png'

  // 触发点击事件以开始下载
  link.click()
}
// 清除幕布图片
const handleBacksPace = () => {
  imageData.value = ''
}

// Request JSON
const requestJson = ref({
  header: {
    app_id: 'c3fbc474',
    uid: 'eae89f64-9f86-4'
  },
  parameter: {
    chat: {
      domain: 's291394db',
      temperature: 0.5,
      max_tokens: 4096,
      width: width.value,
      height: height.value
    }
  },
  payload: {
    message: {
      text: [
        {
          role: 'user',
          content: ''
        }
      ]
    }
  }
})

// Define value and cities
const value = ref('')
const cities = [
  { value: '512x512', label: '512x512' },
  { value: '640x360', label: '640x360' },
  { value: '640x480', label: '640x480' },
  { value: '640x640', label: '640x640' },
  { value: '680x512', label: '680x512' },
  { value: '512x680', label: '512x680' },
  { value: '768x768', label: '768x768' },
  { value: '720x1280', label: '720x1280' },
  { value: '1280x720', label: '1280x720' },
  { value: '1024x1024', label: '1024x1024' }
]

// Image data
const imageData = ref(null)

// Map for resolution to width and height
const resolutionMap = {
  '512x512': { width: 512, height: 512 },
  '640x360': { width: 640, height: 360 },
  '640x480': { width: 640, height: 480 },
  '640x640': { width: 640, height: 640 },
  '680x512': { width: 680, height: 512 },
  '512x680': { width: 512, height: 680 },
  '768x768': { width: 768, height: 768 },
  '720x1280': { width: 720, height: 1280 },
  '1280x720': { width: 1280, height: 720 },
  '1024x1024': { width: 1024, height: 1024 }
}

// Watch for changes in value
watch(value, (newValue) => {
  if (newValue in resolutionMap) {
    width.value = resolutionMap[newValue].width
    height.value = resolutionMap[newValue].height
    requestJson.value.parameter.chat.width = width.value
    requestJson.value.parameter.chat.height = height.value
  }
  console.log(`高度是${height.value}，宽度是${width.value}`)
})

// Get image function
const getImage = async () => {
  if (requestJson.value.payload.message.text[0].content) {
    if (value) {
      console.log(requestJson.value)
      loading.value = true
      try {
        const response = await axios.post(
          'http://156.238.242.214:8080/api/getImage',
          requestJson.value
        )
        const res = response.data
        console.log(res)
        const imgStr = res.data.AIRES.payload.choices.text[0].content
        const imgBase64 = `data:image/png;base64,${imgStr}`
        imageData.value = imgBase64
        imageStore.addImage(imgBase64)
        loading.value = false
      } catch (error) {
        loading.value = false
        warning('错误', '图片违反法律法规无法生成')
        console.error('获取图片失败:', error)
      }
    } else {
      console.warn('你需要选择图片的分辨率')
      warning('错误', '你需要选择图片的分辨率')
    }
  } else {
    console.warn('需要在聊天框中描述你想要的图片')
    warning('错误', '需要在聊天框中描述你想要的图片')
  }
}
</script>

<template>
  <div class="container">
    <!-- 左侧用户控制组件 -->
    <div class="userControl">
      <div class="prompt-box">
        <textarea
          placeholder="输入图片的描述来生成"
          v-model="requestJson.payload.message.text[0].content"
        ></textarea>
      </div>
      <!-- 分辨率选择器 -->
      <div class="select-box">
        <el-select
          v-model="value"
          placeholder="请选择图片分辨率"
          style="width: 240px"
        >
          <el-option
            v-for="item in cities"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span style="float: left">{{ item.label }}</span>
            <span
              style="
                float: right;
                color: var(--el-text-color-secondary);
                font-size: 13px;
              "
            >
              {{ item.value }}
            </span>
          </el-option>
        </el-select>
      </div>
    </div>

    <!-- 中间按钮区域 -->
    <div class="btn-box">
      <button @click="getImage">🪄</button>
    </div>
    <!-- 图片显示区域 -->
    <div class="AI-bot">
      <div class="img-box" v-if="!loading">
        <img :src="imageData" alt="AI生成的图片" v-if="imageData" />
        <el-empty description="你还没点击魔法棒呢" v-else />
      </div>
      <div class="loading-box" v-else>
        <div class="loading-content">
          <p style="font-size: 24px; color: white">正在生成图片...</p>
        </div>
      </div>
      <!-- 图片历史 -->
      <div class="image-history-box">
        <el-image
          v-for="(url, index) in imageStore.imgs"
          :key="index"
          style="width: 100px; height: 100px"
          :src="url"
          :fit="'cover'"
          :preview-src-list="imageStore.imgs"
          :initial-index="index"
        />
      </div>
      <div class="AI-control">
        <!-- 保存按钮点击后保存生成的图片 -->
        <div class="btn" @click="handleSave()">
          <img src="../assets/img/save-svgrepo-com.png" alt="" />
        </div>
        <!-- 保存按钮点击后删除幕布上的图片 -->
        <div class="btn" @click="handleBacksPace()">
          <img
            src="../assets/img/clear-inverse-reflect-horizontal-svgrepo-com.png"
            alt=""
          />
        </div>
        <!-- 保存按钮点击后保存生成的图片 -->
        <div class="btn">
          <img src="../assets/img/clear-option-svgrepo-com.png" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url(../assets/css/main/AIPaintingView.less);
</style>
