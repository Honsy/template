<template>
  <div>
    <button v-on:click="startRecord">开始录音</button>
    <button v-on:click="stopRecord">停止录音</button>
  </div>
</template>

<script>
import { reSampleAndEncodeAudioData } from "./encode";

export default {
  name: "Microphone",
  data() {
    return {
      audioContext: null,
      processorNode: null,
      audioSourceNode: null,
      mediaStream: null,
      dataList: [],
      websocket: null,
      wsConnected: false
    };
  },
  computed: {
    ratio: function () {
      // 不太可能出现这种情况，常见的音频设备采样率是 48k 44.1k
      if (!this.audioContext || this.audioContext.sampleRate < 8000) {
        return 1;
      }
      return Math.floor(this.audioContext.sampleRate / 8000);
    },
  },
  mounted() {
    this.audioContext = new AudioContext();
    // this.websocket = new WebSocket('ws://10.0.16.115:9100');
    this.websocket = new WebSocket('ws://10.0.16.187:8080');
    // this.websocket2 = new WebSocket('ws://10.0.16.187:3000');
    this.websocket.onopen = this.onWebSocketOpen;
    this.websocket.onclose = this.onWebSocketClose;
    this.websocket.onerror = this.onWebSocketError;
    // this.websocket2.onopen = this.onWebSocket2Open;
    // this.websocket2.onclose = this.onWebSocket2Close;
    // this.websocket2.onerror = this.onWebSocket2Error;
  },
  methods: {
    getMediaStream() {
      // 大部分浏览器有安全限制，http 协议访问的页面 navigator.mediaDevices 也是 undefined， 仅提供 https 服务的可以忽略这个问题
      if (!navigator.mediaDevices) {
        return Promise.reject(
          "您的浏览器不支持获取用户设备，无法使用对讲功能，建议使用 Chrome 浏览器 ( 版本 >= 74 )"
        );
      }
      return navigator.mediaDevices
        .getUserMedia({ audio: { sampleRate: 8000 } })
        .catch(() =>
          Promise.reject(
            "请确保录音设备正常，并允许浏览器获取录音权限，否则无法使用对讲功能"
          )
        );
    },

    async makeAudioContextRunning() {
      // 一般不会出现这种情况，以防万一
      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new AudioContext({ sampleRate: 8000 });
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    },

    async startRecord() {
      this.mediaStream = await this.getMediaStream();

      await this.makeAudioContextRunning();
      try {
        this.audioSourceNode = this.audioContext.createMediaStreamSource(
          this.mediaStream
        );
        // 只采集单声道方便处理数据
        this.processorNode = this.audioContext.createScriptProcessor(
          4096,
          1,
          1
        );
        this.audioSourceNode.connect(this.processorNode);
        // sampleRate = 8k & bufferSize = 4096 => 每 0.512s 触发一次 onaudioprocess
        this.processorNode.onaudioprocess = this.onAudioProcess;

        this.processorNode.connect(this.audioContext.destination);
      } catch (e) {
        throw new Error(
          "您的浏览器音频相关接口异常，无法使用对讲功能，建议使用 Chrome 浏览器 ( 版本 >= 74 )"
        );
      }
    },

    onAudioProcess(event) {
      const channelData = event.inputBuffer.getChannelData(0);
      var l = channelData.length;
      var buf = new Int16Array(l)

      while (l--) {
          buf[l] = channelData[l]*0xFFFF;    //convert to 16 bit
      }
      if (this.wsConnected) {
        this.websocket.send(buf)
      }


      return
      // this.dataList.push(channelData.slice());
      // // 每 (bufferSize * ratio / audioContext.sampleRate ～ bufferSize / audioSampleRate = 4096 / 8k = 0.512s) 发送一次数据
      // if (this.dataList.length >= this.ratio) {
      //   this.sendAudioData(this.dataList);
      //   this.dataList = [];
      // }
    },

    sendAudioData(dataList) {
      const base64Audio = reSampleAndEncodeAudioData(
        dataList,
        4096,
        this.ratio
      );

      if (this.wsConnected) {
        this.websocket.send(base64Audio)
      }
      console.log(base64Audio)
    },
    onWebSocket2Open() {
      this.wsConnected = true;
    },
    onWebSocket2Close() {
      this.wsConnected = false;
    },
    onWebSocket2Error() {
      this.wsConnected = false;
    },
    onWebSocketOpen() {
      this.wsConnected = true;
    },
    onWebSocketClose() {
      this.wsConnected = false;
    },
    onWebSocketError(e) {
      console.error(e)
      this.wsConnected = false;
    },
    stopRecord() {
      if (this.dataList.length) {
        this.sendAudioData(this.dataList);
        this.dataList = [];
      }
      this.releaseResources();
    },

    releaseResources() {
      if (this.audioSourceNode) {
        this.audioSourceNode.disconnect();
      }
      if (this.processorNode) {
        this.processorNode.disconnect();
      }
      if (this.mediaStream) {
        this.mediaStream.getAudioTracks().forEach((track) => track.stop());
      }
    },
  },

  beforeDestroy() {
    this.releaseResources();
    this.audioContext.close();
  },
};
</script>

<style scoped>
</style>
