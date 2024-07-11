<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'

// 实例
const router = useRouter()
const route = useRoute()
// 存会话id的
const sessionStore = useSessionStore()

const selectedSessionId = ref(null)
const sessionList = ref([])

// 获取会话列表的方法
const fetchSessionList = async () => {
  try {
    const sessions = await sessionStore.getSessionList()
    if (sessions) {
      sessionList.value = sessions
    } else {
      sessionList.value = []
    }
  } catch (error) {
    console.error('Failed to load session list', error)
    sessionList.value = []
  }
}

// 组件挂载时获取会话列表
onMounted(async () => {
  await fetchSessionList()
})

// 监听路由变化时获取会话列表
watch(route, async () => {
  await fetchSessionList()
})

const handleSessionClick = (id) => {
  selectedSessionId.value = id
  router.push({ path: `/chat/${id}` })
}
</script>

<template>
  <div class="container">
    <div class="sidebar-box">
      <div class="title">
        <div class="context flowing-text">
          <h4>LOONGSON</h4>
        </div>
        <div class="img-box" @click="router.push('/chatHome')"></div>
      </div>
      <br />
      <hr />
      <br />
      <div class="title">
        <div class="context flowing-text" @click="router.push('/AIPainting')">
          龙梦AI绘画
        </div>
      </div>
      <div v-if="sessionList && sessionList.length > 0">
        <div
          v-for="session in sessionList"
          :key="session.uuid"
          :class="[
            'session-item',
            { selected: session.uuid === selectedSessionId }
          ]"
          @click="handleSessionClick(session.uuid)"
        >
          <span>{{ session.title }}</span>
          <div class="img-box">
            <img src="../assets/img/选项-横.png" alt="" />
          </div>
        </div>
      </div>
    </div>
    <div class="main-box">
      <router-view #default="{ route, Component }">
        <transition
          :enter-active-class="`animate__animated ${route.meta.transition}`"
        >
          <component :is="Component"></component>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style lang="less" scoped>
/* AI绘画流光渐变 */
.flowing-text {
  font-size: 16px;
  font-weight: 800;
  background-image: linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: background-position 0.5s ease;

  &:hover {
    background-position: 100% 0;
  }
}

.container {
  display: flex;
}

.sidebar-box {
  width: 15vw;
  height: 100vh;
  background-color: #ffffff;
  padding: 5px;
  border-right: 1px solid #e0e0e0;
}

.main-box {
  width: 100%;
  height: 100vh;
  padding: 10px;
}

.title {
  width: 100%;
  height: 60px;
  border-radius: 50px;
  background-color: #f4f4f4;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 5px;

  .img-box {
    min-width: 30px;
    width: 30px;
    height: 30px;
    background: url('../assets/img/创建任务.png') no-repeat center center;
    background-size: cover;
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #ffffff;
    }
  }
}

.session-item {
  width: 90%;
  height: 40px;
  background-color: rgb(236, 236, 236);
  margin: 0 auto;
  border-radius: 6px;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 7px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgb(210, 210, 210);
  }

  &.selected {
    background-color: rgb(200, 200, 200);
  }

  span {
    display: inline-block;
    max-width: calc(100% - 40px); // 调整以防止与按钮重叠
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .img-box {

    width: 20px; // 固定大小以防止缩小
    height: 20px; // 调整高度以匹配按钮
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer; // 添加鼠标指针

    img {
      width: 100%;
    }
  }
}
</style>
