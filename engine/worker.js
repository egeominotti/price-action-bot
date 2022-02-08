const process = require('process');

function somma(a) {
    return a;
}

process.on("message", (msg) => {
    switch (msg.cmd) {
        case "somma":
            process.send({
                result: somma(msg.data),
            })
    }
});


const cp = require('child_process')

//let worker = cp.fork()
