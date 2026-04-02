const fs = require("fs");

function log(service, level, message) {
  const timestamp = new Date().toISOString();

  const logMessage = `[${timestamp}] [${service}] [${level}] ${message}\n`;

  fs.appendFileSync("app.log", logMessage);
}
module.exports = { log }