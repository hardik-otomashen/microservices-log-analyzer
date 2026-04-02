const fs = require("fs");
const crypto = require("crypto"); // 🔥 ADD THIS
const { analyzeWithAI } = require("./ai-bot");
const{logPaths, outputLog} = require("./exportFunction");

let buffer = [];
let hasNewLogs = false;

// 🔥 track size per file
const lastSizes = {};

// 🔥 ADD THIS (hash storage with time)
const recentHashes = new Map();
const TTL = 60 * 1000; // 1 minute

// 🔥 helper to write central log
function writeToCentralLog(message) {
    fs.appendFile(outputLog, message + "\n", (err) => {
        if (err) console.error("Write error:", err);
    });
}

function startAnalyzer() {
    console.log("Analyzer started...");

    // 🔥 MAIN LOG READER LOOP
    setInterval(() => {
        logPaths.forEach((logPath) => {

            if (!fs.existsSync(logPath)) return;

            const stats = fs.statSync(logPath);

            if (!lastSizes[logPath]) {
                lastSizes[logPath] = 0;
            }

            if (stats.size > lastSizes[logPath]) {

                const stream = fs.createReadStream(logPath, {
                    start: lastSizes[logPath],
                    end: stats.size
                });

                let data = "";

                stream.on("data", chunk => data += chunk);

                stream.on("end", () => {
                    lastSizes[logPath] = stats.size;

                    const lines = data.split("\n");

                    lines.forEach(line => {
                        if (!line) return;

                        const lower = line.toLowerCase();

                        if (lower.includes("error")) {
                            const serviceName = logPath.split("/").slice(-2, -1)[0];

                            const logMessage = `[${new Date().toISOString()}] [${serviceName}] ${line}`;

                            writeToCentralLog(logMessage);

                            buffer.push(logMessage);
                            hasNewLogs = true;
                        }
                    });
                });
            }
        });

    }, 1000);


    // 🔥 AI TRIGGER LOOP (ONLY ONCE — IMPORTANT)
    setInterval(async () => {
        if (!hasNewLogs) return;

        const logsToSend = buffer.slice(-20).join("\n");

        // 🔥 CREATE HASH (ignore timestamps for better dedupe)
        const cleanedLogs = logsToSend.replace(/\[\d{4}-.*?\]/g, "");
        const hash = crypto.createHash("md5").update(cleanedLogs).digest("hex");

        const now = Date.now();

        // 🔥 CLEAN OLD HASHES (TTL)
        for (let [key, time] of recentHashes) {
            if (now - time > TTL) {
                recentHashes.delete(key);
            }
        }

        // 🔥 SKIP DUPLICATE
        if (recentHashes.has(hash)) {
            buffer = [];
            hasNewLogs = false;
            return;
        }

        // 🔥 STORE NEW HASH
        recentHashes.set(hash, now);

        // reset buffer BEFORE calling AI
        buffer = [];
        hasNewLogs = false;

        await analyzeWithAI(logsToSend);

    }, 5000);
}

module.exports = { startAnalyzer };