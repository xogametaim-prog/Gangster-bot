// ==================== gemini.js ====================
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const userChats = new Map();

async function getAIResponseWithMemory(userId, userMessage) {
    try {
        if (!userChats.has(userId)) {
            userChats.set(userId, []);
        }

        let history = userChats.get(userId);
        let promptContext = "أنت بوت ذكي ومساعد في سيرفر ديسكورد. هذه هي المحادثة السابقة مع هذا العضو للتذكر:\n";
        
        history.forEach(chat => {
            promptContext += `${chat.role}: ${chat.text}\n`;
        });
        
        promptContext += `المستخدم: ${userMessage}\nالبوت:`;

        const result = await aiModel.generateContent(promptContext);
        const responseText = result.response.text();

        history.push({ role: "المستخدم", text: userMessage });
        history.push({ role: "البوت", text: responseText });

        if (history.length > 12) {
            history = history.slice(-12);
        }
        userChats.set(userId, history);

        return responseText;
    } catch (error) {
        console.error("خطأ في جلب الرد من جوجل:", error);
        try {
            const fallback = await aiModel.generateContent(userMessage);
            return fallback.response.text();
        } catch (err) {
            return "⚠️ حصلت مشكلة في الاتصال بالذكاء الاصطناعي، تأكد من صحة الـ API Key داخل Render يا غالي!";
        }
    }
}

module.exports = { getAIResponseWithMemory };