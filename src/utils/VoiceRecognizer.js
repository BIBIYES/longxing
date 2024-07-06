/**
 * 讯飞语音流式语音识别api
 */
class VoiceRecognizer {
  constructor() {
    this.recognition = null;
    this.onResult = null;
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Web Speech API is not supported in this browser.');
    } else {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1][0].transcript;
        if (this.onResult) {
          this.onResult(result);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
      };
    }
  }

  start() {
    if (this.recognition) {
      this.recognition.start();
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export default VoiceRecognizer;
