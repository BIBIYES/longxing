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
      <!-- 滑块 -->
      <div class="slider-demo-block">
        <span class="demonstration">图片宽度</span>
        <el-slider v-model="widthIndex" :min="0" :max="customResolutions.length - 1" :marks="marks" show-tooltip />
      </div>
      <div class="slider-demo-block">
        <span class="demonstration">图片高度</span>
        <el-slider v-model="heightIndex" :min="0" :max="customResolutions[customResolutions.length]" :marks="marks" show-tooltip />
      </div>
    </div>
    <!-- 中间按钮区域 -->
    <div class="btn-box">
      <button @click="getImage">🪄</button>
    </div>
    <!-- 图片显示区域 -->
    <div class="AI-bot">
      <div class="img-box" v-if="!loading">
        <img
          :src="`data:image/png;base64,${imageData}`"
          alt="AI生成的图片"
          v-if="imageData"
        />
        <el-empty description="你还没点击魔法棒呢" v-else />
      </div>
      <div class="loading-box" v-else>
        <div class="loading-content">
          <p style="font-size: 24px; color: white">正在生成图片...</p>
        </div>
      </div>
      <div class="AI-control">
        <!-- 保存按钮点击后保存生成的图片 -->
        <div class="btn">
          <img src="../assets/img/保存.png" alt="" />
        </div>
        <!-- 保存按钮点击后删除幕布上的图片 -->
        <div class="btn">
          <img src="../assets/img/保存.png" alt="" />
        </div>
        <!-- 保存按钮点击后保存生成的图片 -->
        <div class="btn">
          <img src="../assets/img/保存.png" alt="" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

// 自定义分辨率列表
const customResolutions = [512, 640, 680, 720, 768, 1024, 1280]

// 创建滑块的索引引用
const widthIndex = ref(0)
const heightIndex = ref(0)

// 创建marks对象用于滑块显示
const marks = customResolutions.reduce((acc, cur, index) => {
  acc[index] = cur
  return acc
}, {})

// 加载动画控制器
const loading = ref(false)
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
      width: customResolutions[widthIndex.value],
      height: customResolutions[heightIndex.value]
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
const imageData = ref(null)

// Watchers to update width and height in requestJson
watch(widthIndex, (newIndex) => {
  requestJson.value.parameter.chat.width = customResolutions[newIndex]
})
watch(heightIndex, (newIndex) => {
  requestJson.value.parameter.chat.height = customResolutions[newIndex]
})

const getImage = async () => {
  console.log(requestJson.value)
  loading.value = true
  try {
    const response = await axios.post(
      'http://locahost:8080/api/getImage',
      requestJson.value
    )
    const res = response.data
    console.log(res)
    imageData.value = res.data.AIRES.payload.choices.text[0].content
    loading.value = false
  } catch (error) {
    console.error('获取图片失败:', error)
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  justify-content: space-evenly;
  align-items: center;
  padding-right: 50px;
}

.userControl {
  width: 40%;
  height: 800px;
  /* border: 1px solid black; Remove border */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff; /* Optional: Add background color */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Add box shadow for depth */
  padding: 20px; /* Add padding for spacing inside the card */
  margin-right: 20px; /* Optional: Add margin for separation */
  border-radius: 5px;
}

.userControl .prompt-box {
  width: 100%;
  height: 400px;
  /* border: 1px black solid; Remove border */
  border-radius: 10px; /* Optional: Add rounded corners */
  background-color: #f0f0f0; /* Optional: Different background color */
  padding: 10px; /* Optional: Inner padding */
}

.userControl .prompt-box textarea {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  resize: none;
  font-family: Helvetica;
  font-size: 16px;
}

button {
  width: 50px;
  height: 50px;
  font-size: 32px;
  border-radius: 10px;
  border: none;
  background-color: #007bff; /* Example: Button background color */
  color: white; /* Example: Button text color */
}

.AI-bot {
  width: 40%;
  height: 800px;
  /* border: 1px solid black; Remove border */
  background-color: #ffffff; /* Optional: Add background color */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Add box shadow for depth */
  padding: 20px; /* Add padding for spacing inside the card */
  margin-left: 20px; /* Optional: Add margin for separation */
  border-radius: 5px;
  display: flex;
  flex-direction: column;
}

.AI-bot .img-box {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 400px;
  /* border: 1px black solid; Remove border */
  border-radius: 10px; /* Optional: Add rounded corners */
  overflow: hidden; /* Optional: Ensure content doesn't overflow */
  margin-bottom: 10px;
  background-color: #f0f0f0;
}
.AI-bot .loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 400px;
  /* border: 1px black solid; Remove border */
  border-radius: 10px; /* Optional: Add rounded corners */
  overflow: hidden; /* Optional: Ensure content doesn't overflow */
  margin-bottom: 10px;
  background-color: #f0f0f0;
}
.loading-box .loading-content {
  font-size: 16px;
  font-weight: 800;
  background-image: linear-gradient(
    45deg,
    #ee7752,
    #e73c7e,
    #23a6d5,
    #23d5ab,
    #23a6d5,
    #e73c7e,
    #ee7752,
    #e73c7e,
    #23a6d5
  );
  background-size: 400%; /* 设置初始背景大小 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: background-position 0.5s ease; /* 设置过渡效果 */
  animation: animateGradient 2s linear infinite; /* 使用动画效果 */
}

@keyframes animateGradient {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
.AI-bot .img-box img {
  height: 400px;
  width: auto; /* Ensure image adjusts proportionally */
  object-fit: cover; /* Optional: Adjust how the image fits */
  border-radius: 5px;
}
.AI-bot .AI-control {
  display: flex;
  justify-content: space-around;
}
/* 保存按钮 */
.AI-bot .AI-control .btn {
  width: 50px;
  height: 50px;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.AI-bot .AI-control .btn img {
  width: 100%;
}

/* 滑块样式 */
.slider-demo-block {
  width: 400px;
  max-width: 400px;
  display: flex;
  align-items: center;
}
.slider-demo-block .el-slider {
  margin-top: 0;
  margin-left: 12px;
}
.slider-demo-block .demonstration {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 44px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}
.slider-demo-block .demonstration + .el-slider {
  flex: 0 0 70%;
}
/* 图片组件样式 */
</style>
