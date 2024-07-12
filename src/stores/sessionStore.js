import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const sessionList = ref([])

  // 创建新的聊天记录会话
  const createNewMessage = (uuid, title) => {
    const newSession = {
      sessionId: uuid || Math.random().toString(36).substr(2, 9), // 使用提供的uuid或生成随机uuid
      title: title || '会话标题', // 使用提供的标题或默认标题
      messages: []
    }
    sessionList.value.push(newSession)
  }

  // 添加聊天记录
  const addChatRecord = (sessionId, messages) => {
    const session = sessionList.value.find((s) => s.sessionId === sessionId)
    if (session) {
      session.messages = messages
    } else {
      console.error(`未找到会话ID为${sessionId}的会话.`)
    }
  }

  // 获取所有会话的列表，每个会话对象包含uuid和title
  const getSessionList = () => {
    return sessionList.value.map(session => ({
      uuid: session.sessionId,
      title: session.title
    }))
  }

  // 通过会话uuid获取当前会话的历史消息
  const getSessionById = (sessionId) => {
    return sessionList.value.find(session => session.sessionId === sessionId)
  }

  const deleteSessionHistory = (sessionId) => {
    console.log(sessionId);
    const sessionIndex = sessionList.value.findIndex(session => session.sessionId === sessionId);
    if (sessionIndex !== -1) {
      sessionList.value.splice(sessionIndex, 1);
    } else {
      console.error(`未找到会话ID为${sessionId}的会话.`);
    }
  }
  

  return {
    sessionList,
    createNewMessage,
    addChatRecord,
    getSessionList,
    getSessionById,
    deleteSessionHistory
  }
}, {
  persist: true
})
