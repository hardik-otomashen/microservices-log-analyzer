require("dotenv").config();

const logPaths = process.env.LOG_PATHS.split(",");

const outputLog = process.env.OUTPUT_LOG;

module.exports = { logPaths, outputLog };