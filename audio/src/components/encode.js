// 将浏览器录制音频编码为 PCMA 格式
// 复制自 https://github.com/rochars/alawmulaw/blob/master/lib/alaw.js

/* eslint-disable no-bitwise */

const LOG_TABLE = [
  1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7
]

/**
 * Encode a 16-bit linear PCM sample as 8-bit A-Law.
 */
function aLawEncode(pcmSample) {
  let compandedValue
  pcmSample = (pcmSample === -32768) ? -32767 : pcmSample
  const sign = ((~pcmSample) >> 8) & 0x80
  if (!sign) {
    pcmSample *= -1
  }
  if (pcmSample > 32635) {
    pcmSample = 32635
  }
  if (pcmSample >= 256) {
    const exponent = LOG_TABLE[(pcmSample >> 8) & 0x7F]
    const mantissa = (pcmSample >> (exponent + 3)) & 0x0F
    compandedValue = ((exponent << 4) | mantissa)
  } else {
    compandedValue = pcmSample >> 4
  }
  return compandedValue ^ (sign ^ 0x55)
}

/**
 * [-1, 1] 的 Float32 转成 Int16 的 PCM 编码
 */
function float32ToInt16PCM(sample) {
  let int16 = Math.round(sample * 32768)
  if (int16 > 32767) int16 = 32767
  if (int16 < -32768) int16 = -32768
  return int16
}

export function encodeAudioData(float32Array) {
  const uint8Array = new Uint8Array(float32Array.length)
  float32Array.forEach((sample, i) => {
    // [-1, 1] 的 Float32 转成 Int16 的 PCM 编码
    const int16 = float32ToInt16PCM(sample)
    // 再转成 Uint8 的 PCMA 编码
    uint8Array[i] = aLawEncode(int16)
  })
  return Buffer.from(uint8Array).toString('base64')
}

export function reSampleAndEncodeAudioData(dataList, bufferSize, ratio) {
  const size = Math.floor(dataList.length * bufferSize / ratio)
  const uint8Array = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    // 按 ratio 重新抽样
    const j = Math.floor(i * ratio / bufferSize)
    const k = i * ratio % bufferSize
    const sample = dataList[j][k]
    // [-1, 1] 的 Float32 转成 Int16 的 PCM 编码
    const int16 = float32ToInt16PCM(sample)
    // 再转成 Uint8 的 PCMA 编码
    uint8Array[i] = aLawEncode(int16)
  }
  return Buffer.from(uint8Array).toString('base64')
}
