<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import {info} from '@/utils/messageUtil'
// 实例
const router = useRouter()
const route = useRoute()
// 存会话id的
const sessionStore = useSessionStore()

const selectedSessionId = ref(null)
const sessionList = ref([])
const menuVisible = ref(false)
const menuPosition = ref({ top: '0px', left: '0px' })
const currentSessionId = ref(null)
// 首页
const backHome = ()=>{
  console.log("回到首页");
  router.push("/chatHome")
  selectedSessionId.value = -1
}
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

const showContextMenu = (event, sessionId) => {
  menuVisible.value = true
  menuPosition.value = { top: `${event.clientY}px`, left: `${event.clientX}px` }
  currentSessionId.value = sessionId
}

const handleMenuOptionClick = (option) => {
  if (option === 'delete') {
    // 在这里添加删除会话的逻辑
    console.log(`Deleting session with id ${currentSessionId.value}`)
  } else if (option === 'edit') {
    // 在这里添加修改会话的逻辑
    console.log(`Editing session with id ${currentSessionId.value}`)
  }
  menuVisible.value = false
}

window.addEventListener('click', () => {
  menuVisible.value = false
})
onMounted(()=>{
  info("更新公告","1.更新了主页\n2.更新一些icon\n3.修复了在主页勾选图片，不跳转的功能")
})

</script>

<template>
  <div class="container">
    <div class="sidebar-box">
      <div class="title">
        <div class="context flowing-text">
          <h4>LOONGSON</h4>
        </div>
        <!-- 介绍框 -->
        <el-popover
          placement="right-end"
          effect="dark"
          title="新建会话"
          :width="150"
          trigger="hover"
          content="点击按钮之后回到主页新建一个会话"
          :show-after="800"
        >
          <template #reference>
            <div class="img-box" @click="backHome()"></div>
          </template>
        </el-popover>
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
          <el-tooltip
            class="box-item"
            effect="dark"
            content="选项"
            placement="top"
            :show-after="800"
          >
            <div
              class="img-box"
              @click.stop="showContextMenu($event, session.uuid)"
            >
              <el-icon><MoreFilled /></el-icon>
            </div>
          </el-tooltip>
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
    <div
      v-if="menuVisible"
      class="context-menu"
      :style="{ top: menuPosition.top, left: menuPosition.left }"
    >
      <ul>
        <li @click="handleMenuOptionClick('edit')">重命名</li>
        <li @click="handleMenuOptionClick('delete')">删除</li>
      </ul>
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
  resize: both;
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

.context-menu {
  position: absolute;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 8px 0;
  width: 120px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #f0f0f0;
      }

      &:first-child {
        border-bottom: 1px solid #eee;
      }

      &:last-child {
        color: red;
      }
    }
  }
}
</style>
