function isValidMessage(message) {
    return typeof message === "string" && message.trim().length > 0;
}

async function sendChatMessage(userMessage, apiKey) {
    if (!isValidMessage(userMessage)) {
        throw new Error("Invalid message");
    }

    const body = {
        systemInstruction: {
            parts: [{
                text: `You are an Irish Rail assistant. Answer questions about train times, 
            ticket prices, leap cards, bike racks, and everything else about it. 
            Keep responses short and informative. Decline non-Irish Rail questions. 
            Do not use * symbols.` }]
        },
        contents: [{ parts: [{ text: userMessage }] }]
    };

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }
    );

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

module.exports = { isValidMessage, sendChatMessage };