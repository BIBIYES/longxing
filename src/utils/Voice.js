// VoiceRecognition.js
import { XfVoiceDictation } from '@muguilin/xf-voice-dictation'

class VoiceRecognition {
  constructor() {
    this.text = ''
    this.times = null

    this.xfVoice = new XfVoiceDictation({
      APPID: 'c3fbc474',
      APISecret: 'YzgzN2E3NzM2NDVjNWRkMGQwZGE5OTEz',
      APIKey: 'f53a5d5b29d3b8c0770b3b51224dbab9',
      onWillStatusChange: (oldStatus, newStatus) => {
        // console.log('识别状态：', oldStatus, newStatus)
      },
      onTextChange: (resultText) => {
        // console.log('识别内容：', resultText)
        this.text = resultText

        if (resultText) {
          clearTimeout(this.times)
          this.times = setTimeout(() => this.xfVoice.stop(), 3000)
        }
      },
      onError: (error) => {
        // console.log('错误信息：', error)
      }
    })
  }

  start() {
    this.xfVoice.start()
  }

  stop() {
    this.xfVoice.stop()
    return this.text
  }

  getText() {
    return this.text
  }
}

export default VoiceRecognition
