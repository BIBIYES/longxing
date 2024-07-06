import CryptoJS from 'crypto-js';

class TextImageUtil {
  constructor() {
    this.APP_ID = 'c3fbc474';
    this.API_KEY = 'f53a5d5b29d3b8c0770b3b51224dbab9';
    this.API_SECRET = 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz';
    this.HOST = 'spark-api.cn-huabei-1.xf-yun.com';
    this.ws = null;
    this.date = null;
    this.authorization = null;
    this.onMessage = null;
    this.onError = null;
    this.init();
  }

  init() {
    const { date, authorization } = this.generateAuthParams();
    this.date = date;
    this.authorization = authorization;
    this.connectWebSocket();
  }

  generateAuthParams() {
    const date = new Date().toUTCString();
    const tmp = `host: ${this.HOST}\ndate: ${date}\nGET /v2.1/image HTTP/1.1`;
    const tmpSha = CryptoJS.HmacSHA256(tmp, this.API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(tmpSha);
    const authorizationOrigin = `api_key="${this.API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin));
    return { date, authorization };
  }

  connectWebSocket() {
    const url = `wss://${this.HOST}/v2.1/image?authorization=${encodeURIComponent(this.authorization)}&date=${encodeURIComponent(this.date)}&host=${encodeURIComponent(this.HOST)}`;
    console.log('WebSocket URL:', url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    this.ws.onmessage = (event) => {
      if (this.onMessage) {
        this.onMessage(event.data);
      }
    };

    this.ws.onclose = () => {
      this.connectWebSocket();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };
  }

  sendMessage(question, imgBase64) {
    const newMessage = [];

    if (imgBase64) {
      newMessage.push({ role: 'user', content: imgBase64, content_type: 'image' });
    }

    if (question) {
      newMessage.push({ role: 'user', content: question, content_type: 'text' });
    }

    const sendMessagePayload = {
      header: { app_id: this.APP_ID, uid: '39769795890' },
      parameter: { chat: { domain: 'general', temperature: 0.5, top_k: 4, max_tokens: 2028, auditing: 'default' } },
      payload: { message: { text: newMessage } }
    };

    console.log(sendMessagePayload);
    this.ws.send(JSON.stringify(sendMessagePayload));
  }

  setOnMessageCallback(callback) {
    this.onMessage = callback;
  }

  setOnErrorCallback(callback) {
    this.onError = callback;
  }
}

export default TextImageUtil;
