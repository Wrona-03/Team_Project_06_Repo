const chatbottog = document.querySelector("#chatbot-toggle");
const messageInput = document.querySelector(".message-input");
const closebottog = document.querySelector("#close-bot");
const chatMain = document.querySelector(".chatbot-main");
const enterBtn = document.querySelector("button[type='submit']");

const API_URL = `/api/chat`;

function sendMessage() {
  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("user-message");
  msgDiv.innerHTML = `<div class="user-text"></div>`;
  msgDiv.querySelector(".user-text").textContent = userMessage;
  chatMain.appendChild(msgDiv);

  async function generateBotResponse(botDiv) {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `You are a irish rail assistant, answer all questions about train times, ticket prices, leap cards, bike racks, and everything else about it. Make all responses short, informative, and quick. if the user asks a question not related to irish rails then politely decline. do not use any * symbols in your responses` }]
        },
        contents: [{
          parts: [{ text: userMessage }]
        }]
      })
    };
    try {
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);
      const botReply = data.candidates[0].content.parts[0].text;
      botDiv.querySelector(".main-text").textContent = botReply;
    } catch (error) {
      console.log(error);
    }
  }

  setTimeout(() => {
    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot-message");
    botDiv.innerHTML = `<svg class="message-bro" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
    </svg>
    <div class="main-text">
      <div class="thinking-bubble">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;

    chatMain.appendChild(botDiv);
    chatMain.scrollTop = chatMain.scrollHeight;
    generateBotResponse(botDiv);
  }, 220);

  messageInput.value = "";
  chatMain.scrollTop = chatMain.scrollHeight;
}

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

enterBtn.addEventListener("click", sendMessage);
chatbottog.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closebottog.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
