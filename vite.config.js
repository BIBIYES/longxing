import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue'],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',  // 输出目录名
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 根据文件类型放到不同目录
          if (/\.(css)$/.test(assetInfo.name)) {
            return 'css/[name].[hash].[ext]';
          }
          if (/\.(png|jpe?g|svg|gif|ico)$/.test(assetInfo.name)) {
            return 'img/[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
      }
    }
  }
})
