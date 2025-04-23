const { spawn } = require("child_process");

// Start index.js
const indexProcess = spawn("node", ["index.js"]);
indexProcess.stdout.on("data", (data) => console.log(`index: ${data}`));
indexProcess.stderr.on("data", (data) => console.error(`index error: ${data}`));

// Start api.js
const apiProcess = spawn("node", ["api.js"]);
apiProcess.stdout.on("data", (data) => console.log(`api: ${data}`));
apiProcess.stderr.on("data", (data) => console.error(`api error: ${data}`));
