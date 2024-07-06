import CryptoJS from 'crypto-js'

const APP_ID = 'c3fbc474'
const API_KEY = 'f53a5d5b29d3b8c0770b3b51224dbab9'
const API_SECRET = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz'
const HOST = 'spark-api.cn-huabei-1.xf-yun.com'

class TextImageUtil {
  constructor() {
    this.date = null
    this.authorization = null
    this.ws = null
    this.onMessageCallback = null
    this.onErrorCallback = null

    this.generateAuthParams()
    this.connectWebSocket()
  }

  generateAuthParams() {
    const curTime = new Date()
    this.date = curTime.toUTCString()

    const tmp = `host: ${HOST}\ndate: ${this.date}\nGET /v2.1/image HTTP/1.1`
    const tmpSha = CryptoJS.HmacSHA256(tmp, API_SECRET)
    const signature = CryptoJS.enc.Base64.stringify(tmpSha)

    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    this.authorization = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(authorizationOrigin)
    )
  }

  connectWebSocket() {
    const url = `wss://${HOST}/v2.1/image?authorization=${encodeURIComponent(
      this.authorization
    )}&date=${encodeURIComponent(this.date)}&host=${encodeURIComponent(HOST)}`
    console.log('WebSocket URL:', url)
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connection opened')
    }

    this.ws.onmessage = (event) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(event.data)
      }
    }

    this.ws.onclose = () => {
      this.connectWebSocket()
    }

    this.ws.onerror = (error) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
      console.error('WebSocket error:', error)
    }
  }

  setOnMessageCallback(callback) {
    this.onMessageCallback = callback
  }

  setOnErrorCallback(callback) {
    this.onErrorCallback = callback
  }

  sendMessage(question, imgBase64) {
    const sendMessagePayload = {
      header: {
        app_id: APP_ID,
        uid: '39769795890'
      },
      parameter: {
        chat: {
          domain: 'general',
          temperature: 0.5,
          top_k: 4,
          max_tokens: 2028,
          auditing: 'default'
        }
      },
      payload: {
        message: {
          text: []
        }
      }
    }

    if (imgBase64) {
      sendMessagePayload.payload.message.text.push({
        role: 'user',
        content: imgBase64,
        content_type: 'image'
      })
    }

    if (question) {
      sendMessagePayload.payload.message.text.push({
        role: 'user',
        content: question,
        content_type: 'text'
      })
    }

    console.log(sendMessagePayload)
    this.ws.send(JSON.stringify(sendMessagePayload))
  }
}

export default TextImageUtil
