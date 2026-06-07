const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("worldcup")
    .setDescription("معلومات كأس العالم 2026"),

  new SlashCommandBuilder()
    .setName("pick_team")
    .setDescription("اختر منتخبك (مرة واحدة فقط)"),

  new SlashCommandBuilder()
    .setName("my_team")
    .setDescription("عرض منتخبك المختار")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Slash commands loaded ✔");
  } catch (err) {
    console.error(err);
  }
})();