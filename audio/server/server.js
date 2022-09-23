
const ws = require('ws');
const fs = require('fs')
const filePath = './test.pcm'
const wss = new ws.WebSocketServer({ host: '10.0.16.187', port: 8080 });
const Speaker = require('speaker');

const speaker = new Speaker({
  channels: 1,          // 1 channel
  bitDepth: 16,         // 32-bit samples
  sampleRate: 48000,     // 48,000 Hz sample rate
  signed:true
});


wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    // var s = b.toString();
    speaker.write(data);
    // let buffer = new Buffer(data, 'base64');
    // let fileExist = fs.existsSync(filePath)

    // if (fileExist) {
    //   fs.appendFile(filePath, buffer,function(e) {
    //     console.log(e)
    //   })
    // } else {
    //   fs.writeFile(filePath, buffer, function(e) {
    //     console.log(e)
    //   })
    // }
    // fs.writeFile()
  });

  ws.send('something');
});