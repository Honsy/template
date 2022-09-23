<template>
    <div>
        <button v-on:click="startRecord">开始录音</button>
        <button v-on:click="stopRecord">停止录音</button>
    </div>
</template>

<script>
  import { encodeAudioData } from './encode'

  export default {
    name: "Microphone",
    data() {
      return {
        audioContext: null,
        processorNode: null,
        audioSourceNode: null,
        mediaStream: null
      }
    },
    mounted() {
      // sampleRate 浏览器兼容性: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#browser_compatibility
      this.audioContext = new AudioContext({ sampleRate: 8000 })
    },
    methods: {
      getMediaStream() {
        // 大部分浏览器有安全限制，http 协议访问的页面 navigator.mediaDevices 也是 undefined， 仅提供 https 服务的可以忽略这个问题
        if (!navigator.mediaDevices) {
          return Promise.reject('您的浏览器不支持获取用户设备，无法使用对讲功能，建议使用 Chrome 浏览器 ( 版本 >= 74 )')
        }
        // 此处设置 sampleRate 的作用是尝试获取采样率尽可能接近这个数字的媒体，并非实际采样率
        return navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 8000 } })
          .catch(_ => Promise.reject('请确保录音设备正常，并允许浏览器获取录音权限，否则无法使用对讲功能'))
      },

      async makeAudioContextRunning() {
        // 一般不会出现这种情况，以防万一
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioContext({ sampleRate: 8000 })
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }
      },

      async startRecord() {
        this.mediaStream = await this.getMediaStream()

        await this.makeAudioContextRunning()
        try {
          this.audioSourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
          // 只采集单声道方便处理数据
          this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1)
          this.audioSourceNode.connect(this.processorNode)
          // sampleRate = 8k & bufferSize = 4096 => 每 0.512s 触发一次 onaudioprocess
          this.processorNode.onaudioprocess = this.onAudioProcess
          console.log(this.audioContext)
          this.processorNode.connect(this.audioContext.destination)
        } catch (e) {
          throw new Error('您的浏览器音频相关接口异常，无法使用对讲功能，建议使用 Chrome 浏览器 ( 版本 >= 74 )')
        }
      },

      onAudioProcess(event) {
        console.log(event)
        const channelData = event.inputBuffer.getChannelData(0)
        this.sendAudioData(channelData.slice())
      },

      sendAudioData(float32Array) {
        const base64Audio = encodeAudioData(float32Array)
        // TODO post data
        // console.log(base64Audio)
      },

      stopRecord() {
        this.releaseResources()
      },

      releaseResources() {
        if (this.audioSourceNode) {
          this.audioSourceNode.disconnect()
        }
        if (this.processorNode) {
          this.processorNode.disconnect()
        }
        if (this.mediaStream) {
          this.mediaStream.getAudioTracks().forEach(track => track.stop())
        }
      }
    },

    beforeDestroy() {
      this.releaseResources()
      this.audioContext.close()
    }
  }
</script>

<style scoped>

</style>
