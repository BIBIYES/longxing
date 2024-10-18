// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatView from '@/views/ChatView.vue'
import ChatHomeView from '@/views/ChatHomeView.vue'
import AIPainting from '@/views/AIPaintingView.vue'
// 测试试图
import testView from '@/views/testView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  BASE_URL:'/',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/chatHome',
      children: [
        {
          path: 'chatHome',
          name: 'chatHome',
          component: ChatHomeView
        },
        {
          path: 'chat/:id',
          name: 'chat',
          component: ChatView
        },
        {
          path: '/AIPainting',
          name: '/AIPainting',
          component: AIPainting
        },
        {
          path: '/test',
          name: 'test',
          component: testView
        },
      ]
    }
  ]
})
export default router
