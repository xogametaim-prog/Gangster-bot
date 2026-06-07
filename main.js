const express = require("express");
const {
Client,
GatewayIntentBits,
Events
} = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
res.send("World Cup 2026 Bot Online");
});

app.listen(PORT, () => {
console.log("Web server running on port ${PORT}");
});

const client = new Client({
intents: [
GatewayIntentBits.Guilds
]
});

client.once(Events.ClientReady, (readyClient) => {
console.log("Logged in as ${readyClient.user.tag}");
});

client.on(Events.InteractionCreate, async (interaction) => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "worldcup") {
    await interaction.reply("🏆 World Cup 2026 Bot is ready!");
}

if (interaction.commandName === "teams") {
    await interaction.reply(
        "🌍 قائمة المنتخبات ستتم إضافتها لاحقاً."
    );
}

if (interaction.commandName === "pick_team") {
    await interaction.reply(
        "⚽ نظام اختيار المنتخب سيتم ربطه بقاعدة البيانات."
    );
}

if (interaction.commandName === "my_team") {
    await interaction.reply(
        "📋 سيتم عرض منتخبك المختار هنا."
    );
}

if (interaction.commandName === "leaderboard") {
    await interaction.reply(
        "🏅 لوحة المتصدرين قيد التطوير."
    );
}

if (interaction.commandName === "guess_team") {
    await interaction.reply(
        "❓ لعبة خمن المنتخب قيد التطوير."
    );
}

});

client.login(process.env.DISCORD_TOKEN);