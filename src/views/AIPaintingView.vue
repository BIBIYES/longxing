<script setup>
import { onMounted, ref } from 'vue'
import { warning } from '../utils/messageUtil';
import { useImageStore } from '@/stores/useImageStore.js'
import axios from 'axios'

// 字数追踪
const textNumber = ref(0)
const textareaRef = ref(null)
const inputChange = () => {
  textNumber.value = textareaRef.value.value.length
}

// 图片数据
const imageData = ref('')

// 图片历史
const imageStore = useImageStore()

// 绘画提示词
const prompt = ref('')

// 动画控制器
const isLoading = ref(false)

// 采样率
const samplingRate = ref(0.5)
// 画作尺寸
const resolutions = [
  '512x512',
  '640x360',
  '640x480',
  '640x640',
  '680x512',
  '512x680',
  '768x768',
  '720x1280',
  '1280x720',
  '1024x1024'
]
// 浏览器下载imgdatabase64为图片
const saveImage = (img) => {


  // 检查 imgData 是否存在且非空
  if (!img) {
    console.warn('Image data is undefined or null');
    return;
  }
  console.log(img);
  // 创建一个 <a> 元素
  const link = document.createElement('a');

  // 设置下载的文件名（可以根据需求修改）
  link.download = prompt.value + '.png';

  // 设置 <a> 元素的 href 属性为 base64 图片数据
  link.href = img;

  // 触发点击事件，启动下载
  link.click();

  // 移除 <a> 元素（清理）
  link.remove();
}



// 画作高度
const canvasHeight = ref(512)

// 画作宽度
const canvasWidth = ref(512)

// 画作高宽控制器
const updateCanvasSize = (width, height) => {
  canvasWidth.value = width
  canvasHeight.value = height
}

// 开始画作
const startDraw = async () => {
  // 判断是否设置了高度
  if (!canvasHeight.value) {
    warning("未设置分辨率", "你需要告诉我，需要多大的画布呢?")
    return
  }
  //判断是否写了提示词
  if (!prompt.value) {
    warning("未书写提示词", "我需要你给我一个提示，我才能开始作画嗷")
    return
  }
  // 判断文字是否大于4
  if (textNumber.value <= 4) {
    warning("描述模糊不清", "你的描述内容有点少，这会影响到作画的质量，请您仔细描述你脑海中想象的画面")
    return
  }
  isLoading.value = true
  console.log(prompt.value);
  // Request JSON
  const requestJson = ref({
    header: {
      app_id: 'c3fbc474',
      uid: 'eae89f64-9f86-4'
    },
    parameter: {
      chat: {
        domain: 's291394db',
        temperature: samplingRate.value,
        max_tokens: 4096,
        width: parseInt(canvasWidth.value),
        height: parseInt(canvasHeight.value)
      }
    },
    payload: {
      message: {
        text: [
          {
            role: 'user',
            content: prompt.value + style.value
          }
        ]
      }
    }
  })
  console.log("请求图片", requestJson);
  //发送请求
  const response = await axios.post(
    'https://longxing.bibiyes.xyz/api/getImage',
    requestJson.value
  )
  const res = response.data
  console.log(res)
  const imgStr = res.data.AIRES.payload.choices.text[0].content
  const imgBase64 = `data:image/png;base64,${imgStr}`
  imageData.value = imgBase64
  isLoading.value = false
  imageStore.addImage(imageData.value)

}

// 样式提示词
const style = ref('')

// 选中的样式名称
const selectedStyle = ref('')

// 修改样式提示词函数
const changeStyle = (newStyle) => {
  style.value = newStyle
  selectedStyle.value = newStyle
}

// 清除画布
const clearCanvas = () => {
  imageData.value = ''
}

onMounted(() => {
  console.log(imageStore.imgs);
})
</script>
<template>
  <div class="container">
    <div class="ai_box">
      <!-- 用户控制面板 -->
      <div class="user_control">
        <!-- 提示词输入框 -->
        <div class="prompt">
          <textarea name="" id="" ref="textareaRef" @input="inputChange" v-model="prompt"
            placeholder="在这里输入你画作描述~"></textarea>
          <el-popover placement="left" title="小贴士" :width="200" trigger="hover" content="尽可能仔细描述你画作，可以让画面更加丰富嗷~">
            <template #reference>
              <div class="tips">
              </div>
            </template>
          </el-popover>

        </div>
        <div class="call_word">
          <p>你还可以输入✨</p>
          <p>{{ textNumber }}/1000</p>
        </div>
        <div class="generant" @click="startDraw()">
          生成画作
        </div>
        <!-- 参数面板 -->
        <div class="parameter_panel">
          <!-- 样式选择器 暂时隐藏-->
          <div class="select_style_box" v-show="true">
            <h4>风格化</h4>
            <!-- 样式盒子大 -->
            <div class="style_box">

              <!-- 样式盒子 -->
              <div class="box" @click="changeStyle('写实风格')" :class="{ selected: selectedStyle === '写实风格' }">
                <img src="../assets/img/AIiPainting/xieshi.png" alt="">
                <div class="title">写实</div>
              </div>

              <div class="box" @click="changeStyle('油画风格')" :class="{ selected: selectedStyle === '油画风格' }">
                <img src="../assets/img/AIiPainting/youhua.png" alt="">
                <div class="title">油画</div>
              </div>
              <div class="box" @click="changeStyle('动漫风格')" :class="{ selected: selectedStyle === '动漫风格' }">
                <img src="../assets/img/AIiPainting/dongman.png" alt="">
                <div class="title">动漫</div>
              </div>

              <div class="box" @click="changeStyle('印象派')" :class="{ selected: selectedStyle === '印象派' }">
                <img src="../assets/img/AIiPainting/yingxiangpai.png" alt="">
                <div class="title">印象派</div>
              </div>

              <div class="box" @click="changeStyle('素描风格')" :class="{ selected: selectedStyle === '素描风格' }">
                <img src="../assets/img/AIiPainting/sumiao.png" alt="">
                <div class="title">素描</div>
              </div>

              <div class="box" @click="changeStyle('水彩风格')" :class="{ selected: selectedStyle === '水彩风格' }">
                <img src="../assets/img/AIiPainting/shuicai.png" alt="">
                <div class="title">水彩</div>
              </div>
              <div class="box" @click="changeStyle('照片风格')" :class="{ selected: selectedStyle === '照片风格' }">
                <img src="../assets/img/AIiPainting/photo.png" alt="">
                <div class="title">照片</div>
              </div>

              <div class="box" @click="changeStyle('卡通风格')" :class="{ selected: selectedStyle === '卡通风格' }">
                <img src="../assets/img/AIiPainting/katong.png" alt="">
                <div class="title">卡通</div>
              </div>
            </div>
          </div>
          <div class="select_resolution">
            <div class="title">
              <h4>
                分辨率
              </h4>
              <p v-show="canvasHeight">宽度：{{ canvasWidth }} &nbsp;&nbsp;&nbsp; 高度：{{ canvasHeight }} </p>
              <el-popover placement="left" title="分辨率" :width="200" trigger="hover"
                content="分辨率实际上就是画布的大小、比列、数值越大，图片的质量就越大，但是等待的时间就越长">
                <template #reference>
                  <div class="tips">
                  </div>
                </template>
              </el-popover>
            </div>
            <el-dropdown placement="bottom" style="width: 100%;">
              <el-button style="width: 100%;">选择分辨率</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="res in resolutions" :key="res"
                    @click="updateCanvasSize(res.split('x')[0], res.split('x')[1])">
                    {{ res }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

          </div>
          <div class="select_resolution">
            <div class="title">
              <h4>
                采样率
              </h4>
              <el-popover placement="left" title="采样率" :width="200" trigger="hover" content="采样率越大，作画的风格就越贴合你的提示词">
                <template #reference>
                  <div class="tips">
                  </div>
                </template>
              </el-popover>
            </div>
            <div class="slider-demo-block" style="padding: 10px;">
              <span class="demonstration"></span>
              <!-- 绑定 v-model 到 samplingRate -->
              <!-- 设置 min 为 0.0，max 为 1，step 为 0.1 -->
              <el-slider v-model="samplingRate" :min="0.1" :max="1" :step="0.1"></el-slider>
            </div>
          </div>
        </div>
      </div>
      <!-- ai输出面板 -->
      <div class="ai_output">
        <!-- 画布 -->
        <div class="canvas">
          <div class="img-box" v-if="!isLoading">
            <el-image style="width: 100%; " :src="imageData" fit="cover" v-if="imageData" :preview-src-list="imageStore.imgs
              "></el-image>
            <el-empty description="还没有开始绘画" v-else />
          </div>
          <div class="loading-box" v-else="isLoading">
            <div class="loading-content">
              <p style="font-size: 24px; color: white">正在生成图片...</p>
            </div>
          </div>
        </div>
        <!--控制器 -->
        <div class="controller">
          <!-- 清除画布 -->
          <div class="item" @click="clearCanvas()">
            <img src="../assets/img/cross-circle.svg" alt="">
          </div>
          <!-- 下载图片 -->
          <div class="item" @click=saveImage(imageData)>
            <img src="../assets/img/arrow-down-to-dotted-line.svg" alt="">
          </div>
          <!-- 清除所有图片历史 -->
          <div class="item" @click="imageStore.clear()">
            <img src="../assets/img/trash-undo.svg" alt="">
          </div>

        </div>
        <!-- 画历史 -->
        <div class="image-history-box">
          <div class="title">
            <h4>
              历史记录
            </h4>
          </div>
          <div class="history-list" v-if="imageStore.imgs.length > 0">
            <div class="history-item" v-for="(item, index) in imageStore.imgs" :key="index">
              <el-image style="width: 100px;border-radius: 10px; " :src="item" :preview-src-list="imageStore.imgs"
                :initial-index="index">
              </el-image>
            </div>
          </div>
          <!-- 空历史  -->
          <div class="empty-history" v-else>
            <div class="content">
              <div class="img-box">
                <img src="../assets/img/time-past.svg" alt="">
              </div>
              <p>暂无历史记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="less">
@common-width: 600px;
@bg-color-light: #f0f0f0;
@bg-color-dark: #ffffff;
@primary-color: #007bff; // Blue color for buttons
@box-shadow: 10px 10px 30px #a0a0a0, -10px -10px 30px #ffffff;
@border-radius: 10px;
@text-color: #333;
@text-color-muted: #999;

h4 {
  margin-bottom: 5px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* 通用过渡效果 */
* {
  transition: opacity 0.5s, visibility 0.5s;
}

/* 当元素的 display 被设置为 none 时 */
[style*="display: none"] {
  opacity: 0;
  visibility: hidden;
}

.container {
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai_box {
  width: 84vw;
  min-height: 95vh;
  background-color: @bg-color-light;
  border-radius: @border-radius;
  display: flex;
  justify-content: space-around;

  .user_control {
    height: 800px;
    padding-top: 30px;

    .prompt,
    .call_word,
    .generant,
    .parameter_panel {
      width: @common-width;
      margin: 0 auto;
      border-radius: 5px;
    }

    .prompt {
      height: 180px;
      background-color: white;
      margin-bottom: 3px;
      position: relative;

      @media (prefers-color-scheme: dark) {
        filter: invert(100%);
      }

      textarea {
        background: none;
        width: 100%;
        height: 100%;
        border: none;
        resize: none;
        outline: none;
        padding: 5px;
        font-size: 15px;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: @text-color;
      }

      .tips {
        width: 20px;
        height: 20px;
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 12px;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        background: url(../assets/img/interrogation.svg) center center;
        background-size: cover;
        color: @text-color-muted;
      }
    }

    .call_word {
      height: 30px;
      display: flex;
      font-size: 13px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      justify-content: space-between;
      color: @text-color-muted;
    }

    .generant {
      height: 50px;
      background-color: @primary-color;
      text-align: center;
      color: white;
      line-height: 50px;
      cursor: pointer;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-weight: bold;

    }

    .parameter_panel {
      height: 500px;

      .select_style_box,
      .select_resolution {
        height: auto;
        margin-top: 5px;
        padding: 10px;
        background-color: @bg-color-dark;
        border-radius: @border-radius;

        @media (prefers-color-scheme: dark) {
          background-color: #121212;
          color: white;

        }
      }

      .select_style_box {
        height: 350px;

        .style_box {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          justify-content: center;

          .box {
            width: 120px;
            height: 120px;
            border-radius: 20px;
            background: #c0c0c0;
            cursor: pointer;
            transition: all 0.3s ease;



            img {
              width: 100%;
              height: 100%;
              background-color: rgb(135, 135, 135);
              border-radius: 20px;
            }

            .title {
              width: 50px;
              margin: 0 auto;
              text-align: center;
              color: @text-color;

              @media (prefers-color-scheme: dark) {
                background-color: #121212;
                color: white;

              }

              font-family: 'Helvetica Neue',
              Arial,
              sans-serif;
            }
          }

          /* 新增选中样式 */
          .selected {
            // border: 2px solid @primary-color;
            // box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
            position: relative;
            /* 你可以根据需要调整颜色和阴影效果 */
          }

          /* 如果想要更显著的效果，还可以在边框之外添加一些动画效果 */
          .selected::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            top: 45%;
            left: 40%;
            background-color: rgb(2, 91, 255);

            border: 5px solid white;
            border-radius: 20px;
            animation: pulse 1.5s infinite;
          }

          @keyframes pulse {

            0%,
            100% {
              background-color: white
            }

            50% {
              background-color: rgb(2, 91, 255)
            }
          }
        }
      }

      .select_resolution {
        height: 85px;

        .title {
          display: flex;
          justify-content: space-between;
          color: @text-color;
          font-family: 'Helvetica Neue', Arial, sans-serif;

          @media (prefers-color-scheme: dark) {

            filter: invert(100%);
          }

          .tips {
            width: 20px;
            height: 20px;
            background: url(../assets/img/interrogation.svg) center center no-repeat;
            background-size: cover;
          }
        }
      }
    }
  }

  .ai_output {
    height: 800px;
    display: flex;
    justify-content: center;
    padding-top: 30px;
    flex-direction: column;

    .canvas {
      width: 600px;
      height: 500px;
      background-color: white;
      border-radius: @border-radius;
      overflow: hidden;

      @media (prefers-color-scheme: dark) {
        background-color: #121212;
        color: white;
      }

      // loading动画
      .loading-box {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 10px;
        background-color: white;

        @media (prefers-color-scheme: dark) {
          background-color: #121212;
          color: white;
        }

        .loading-content {
          font-size: 16px;
          font-weight: 800;
          background-image: linear-gradient(45deg,
              #ee7752,
              #e73c7e,
              #23a6d5,
              #23d5ab,
              #23a6d5,
              #e73c7e,
              #ee7752,
              #e73c7e,
              #23a6d5);
          background-size: 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;
          display: inline-block;
          cursor: pointer;
          transition: background-position 0.5s ease;
          animation: animateGradient 2s linear infinite;
        }

        @keyframes animateGradient {
          0% {
            background-position: 0% 50%;
          }

          100% {
            background-position: 100% 50%;
          }
        }
      }

      .img-box {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    .controller {
      margin-top: 10px;
      width: 600px;
      height: 100px;
      background-color: white;
      border-radius: 10px;
      display: flex;
      justify-content: space-around;
      align-items: center;

      @media (prefers-color-scheme: dark) {
        background-color: #121212;
        color: white;
      }

      .item {
        width: 50px;
        height: 50px;
        background-color: #f5f5f5;
        border-radius: 10px;
        cursor: pointer;

        @media (prefers-color-scheme: dark) {
          background-color: #6b6b6b;
          color: white;

        }


        img {
          width: 100%;
          padding: 10px;
        }


      }




    }

    .image-history-box {
      width: 600px;
      height: 200px;
      margin-top: 10px;

      .history-list {
        background-color: white;
        width: 600px;
        height: 200px;
        display: flex;
        flex-wrap: wrap;
        border-radius: 10px;

        @media (prefers-color-scheme: dark) {
          background-color: #121212;
          color: white;
        }

        /* 允许换行 */
        gap: 11px;
        /* 设置盒子之间的间距 */
        overflow-y: auto;
        /* 允许上下滑动 */
        max-height: 400px;
        /* 设置最大高度，确保在内容多的时候能滚动 */
        padding: 10px;
        /* 增加内边距 */
        box-sizing: border-box;
        /* 让 padding 不影响元素宽度 */
        flex-wrap: 5;
        padding-left: 30px;
      }
    }

    .empty-history {
      width: 600px;
      height: 200px;
      display: flex;
      border-radius: 10px;
      justify-content: center;
      align-items: center;
      background-color: white;

      .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .img-box {
          width: 20px;

          img {
            width: 100%;
          }
        }
      }

      @media (prefers-color-scheme: dark) {
        filter: invert(100%);
        color: black;
      }
    }
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  @bg-color-light: #1e1e1e;
  @bg-color-dark: #2e2e2e;
  @text-color: #cccccc;
  @text-color-muted: #888888;
  @primary-color: #007bff; // 深色模式下可以保持不变，但你可以根据需要调整

  .ai_box {
    background-color: @bg-color-light;
  }

  .user_control {
    .prompt {
      background-color: @bg-color-dark;

      textarea {
        color: @text-color;
      }

      .tips {
        color: @text-color-muted;
      }
    }

    .call_word {
      color: @text-color-muted;
    }

    /* 添加动画效果 */
    .generant {
      height: 50px;
      background-color: @primary-color;
      text-align: center;
      color: white;
      line-height: 50px;
      cursor: pointer;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-weight: bold;
      transition: background-color 0.3s ease, transform 0.3s ease;
      /* 添加过渡效果 */
    }

    /* 鼠标悬停时的效果 */
    .generant:hover {
      background-color: darken(@primary-color, 10%);
      /* 深化背景颜色 */

      /* 放大按钮 */
    }

    /* 鼠标按下时的效果 */
    .generant:active {
      transform: scale(0.95);
      /* 缩小按钮 */
    }

    .parameter_panel {

      .select_style_box,
      .select_resolution {
        background-color: @bg-color-dark;
      }

      .select_style_box {
        .box {
          background: #555555;

          .title {
            color: @text-color;
          }
        }
      }

      .select_resolution {
        .title {
          color: @text-color;
        }
      }
    }
  }

  .ai_output {

    .canvas,
    .controller,
    .image-history-box,
    .empty-history {
      background-color: @bg-color-dark;
    }

    .controller .item {
      background-color: #444444;
    }
  }
}
</style>