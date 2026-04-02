const axios = require("axios");
require("dotenv").config();

async function analyzeWithAI(logs) {
    if (!logs || logs.trim().length === 0) return;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a backend debugging expert. Analyze logs and find root cause."
                    },
                    {
                        role: "user",
                        content: `Logs:\n${logs}\n\nWhat is the issue and probable cause?`
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("__________________________________________________________________________________________________________________")
        console.log("\n🧠 AI ANALYSIS:\n", response.data.choices[0].message.content);
        console.log("__________________________________________________________________________________________________________________")
    } catch (err) {
        console.error("AI error:", err.response?.data || err.message);
    }
}

module.exports = { analyzeWithAI };