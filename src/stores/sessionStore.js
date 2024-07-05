// stores/sessionStore.js
import { defineStore } from 'pinia'

export const useSessionStore = defineStore({
  id: 'session',
  state: () => ({
    sessions: []
  }),
  actions: {
    addSession(session) {
      this.sessions.push(session)
    }
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'session',
        storage: localStorage,
      },
    ],
  },
})
