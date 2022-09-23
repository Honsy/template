<template>
  <div id="app">
    <Microphone />
  </div>
</template>

<script>
// 如果只需要支持新版本浏览器（如 Chrome >= 74，支持 AudioContext 采样率设置），参考这个文件
// import Microphone from "./components/Microphone";
// 如果要兼容更多版本浏览器，参考这个文件进行重采样（抽样），抽样后可能不是准确的 8k（取决于设备采样率是否是 8k 整数倍）
import Microphone from "./components/ReSample";

export default {
  name: 'App',
  components: {
    Microphone
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
