const {spawn} = require("child_process");

let timeFrame = [
    //'1m',
    '5m',
    '15m',
    '1h',
    '4h',
    '8h',
    '1D',
    '3D',
    '1W',
]

for (let time of timeFrame) {

    const bot = spawn('node', ['bot.js', time]);
    bot.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    bot.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    bot.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}


