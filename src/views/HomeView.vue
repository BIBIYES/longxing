<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { info } from '@/utils/messageUtil'
import { MoreFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()

const selectedSessionId = ref(null)
const sessions = ref([])
const activeOptionBox = ref(null) // 用于存储当前显示选项框的会话ID
const clickToClose = ()=>{
  activeOptionBox.value = null
}
const goHome = () => {
  router.push('/chatHome')
  selectedSessionId.value = -1
}

const loadSessions = async () => {
  try {
    const sessionList = await sessionStore.getSessionList()
    sessions.value = sessionList || []
  } catch (error) {
    console.error('Failed to load session list', error)
    sessions.value = []
  }
}

onMounted(() => {
  loadSessions()
  info(
    "欢迎使用龙梦GPT,目前处于测试阶段，当您看到这个消息，说明您被邀请测试，非常感谢您，请您毫不留情的批评我们，这是对我们最大的鼓励-我和评委站一队项目组"
  )
})

watch(route, loadSessions)

const handleSessionClick = (id) => {
  selectedSessionId.value = id
  router.push(`/chat/${id}`)
}

const toggleOptionsBox = (event, id) => {
  event.stopPropagation()
  activeOptionBox.value = activeOptionBox.value === id ? null : id
}

const renameSession = (id) => {
  console.log(`Renaming session ${id}`)
}

const deleteSession = (id) => {
  console.log(`Deleting session ${id}`)
  sessionStore.deleteSessionHistory(id)
  router.push('/chatHome')
  loadSessions()
}
</script>

<template>
  <div class="container" @click="clickToClose()">
    <div class="sidebar">
      <div class="title" @click="goHome">
        <div class="img-box">
          <img src="../assets/img/create-svgrepo-com.png" alt="创建会话" />
        </div>
        <h4 class="flowing-text">创建会话</h4>
      </div>
      <hr />
      <div class="title" @click="router.push('/AIPainting')">
        <div class="img-box">
          <img src="../assets/img/search.png" alt="龙梦绘画" />
        </div>
        <h4 class="flowing-text">龙梦绘画</h4>
      </div>
      <div v-if="sessions.length">
        <div
          v-for="session in sessions"
          :key="session.uuid"
          :class="[
            'session-item',
            { selected: session.uuid === route.params.id } // 修改这里
          ]"
          @click="handleSessionClick(session.uuid)"
        >
          <span>{{ session.title }}</span>
          <div class="options-box" v-if="activeOptionBox === session.uuid">
            <div class="option-item" @click.stop="renameSession(session.uuid)">
              <div class="img-box">
                <img src="../assets/img/rename-svgrepo-com.png" alt="" />
              </div>
              <h4>重命名</h4>
            </div>
            <div class="option-item" @click.stop="deleteSession(session.uuid)">
              <div class="img-box">
                <img src="../assets/img/garbage-svgrepo-com.png" alt="" />
              </div>
              <h4 style="color: #fe5d5d">删除</h4>
            </div>
          </div>
          <el-tooltip
            effect="dark"
            content="选项"
            placement="top"
            :show-after="800"
          >
            <div
              class="img-box"
              @click.stop="toggleOptionsBox($event, session.uuid)"
            >
              <el-icon><MoreFilled /></el-icon>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div class="main">
      <router-view v-slot="{ Component }">
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
.flowing-text {
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
  transition: background-position 0.5s ease;

  &:hover {
    background-position: 100% 0;
  }
}

.container {
  display: flex;
}

.sidebar {
  width: 15vw;
  height: 100vh;
  background-color: #ffffff;
  padding: 5px;
  border-right: 1px solid #e0e0e0;
}
.main {
  width: 100%;
  height: 100vh;
  padding: 10px;
}

.title {
  width: 100%;
  height: 60px;
  background-color: #ececec;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 5px;
  margin-bottom: 5px;
  .img-box {
    width: 30px;
    height: 30px;
    margin-right: 10px;
    position: relative;
    img {
      width: 100%;
    }
  }

  h4 {
    margin: 0;
  }
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 7px;
  margin: 10px auto;
  width: 90%;
  background-color: rgb(236, 236, 236);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
  .options-box {
    width: 100px;
    height: 100px;
    background-color: rgb(255, 255, 255);
    position: absolute;
    right: -90px;
    bottom: -90px;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    .option-item {
      width: 100%;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      .img-box {
        height: 10px;
      }
      h4 {
        width: 40px;
      }
      &:hover {
        background-color: #e0e0e0;
      }
    }
  }

  &:hover {
    background-color: rgb(210, 210, 210);
  }

  &.selected {
    background-color: rgb(200, 200, 200);
  }

  span {
    max-width: calc(100% - 40px);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .img-box {
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    img {
      width: 100%;
    }
  }
}
</style>
