const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const Database = require('better-sqlite3');

// 1️⃣ إعداد خادم الويب لمنصة Render
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('World Cup 2026 Bot v1.2 Is Online!'));
app.listen(port, () => console.log(`Web server listening on port ${port}`));

// 2️⃣ إعداد قاعدة البيانات لحفظ نقاط المتصدرين (Leaderboard)
const db = new Database('leaderboard.db');
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        username TEXT,
        points INTEGER DEFAULT 0
    )
`).run();

// 3️⃣ إنشاء عميل الديسكورد مع النوايا المطلوبة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const BOT_NAME = "world cup 2026 bot";
const BOT_VERSION = "1.2v";
const activeGames = new Set();

// 4️⃣ بيانات الأعلام والدول (يدعم الإجابة باللغتين)
const gameData = [
    { countryAr: "المغرب", countryEn: "morocco", flagUrl: "https://flagcdn.com/w640/ma.png" },
    { countryAr: "السعودية", countryEn: "saudi arabia", flagUrl: "https://flagcdn.com/w640/sa.png" },
    { countryAr: "مصر", countryEn: "egypt", flagUrl: "https://flagcdn.com/w640/eg.png" },
    { countryAr: "الأرجنتين", countryEn: "argentina", flagUrl: "https://flagcdn.com/w640/ar.png" },
    { countryAr: "فرنسا", countryEn: "france", flagUrl: "https://flagcdn.com/w640/fr.png" },
    { countryAr: "البرازيل", countryEn: "brazil", flagUrl: "https://flagcdn.com/w640/br.png" },
    { countryAr: "المكسيك", countryEn: "mexico", flagUrl: "https://flagcdn.com/w640/mx.png" },
    { countryAr: "أمريكا", countryEn: "usa", flagUrl: "https://flagcdn.com/w640/us.png" },
    { countryAr: "كندا", countryEn: "canada", flagUrl: "https://flagcdn.com/w640/ca.png" }
];

// 5️⃣ قائمة المجموعات والفرق المشاركة كمثال
const teamsData = {
    ar: "🏆 **الفرق المشاركة المبرمجة حالياً في المجموعات الأولية:**\n• **المجموعة أ:** المكسيك، كندا، أمريكا\n• **المجموعة ب:** الأرجنتين، فرنسا، البرازيل، المغرب، مصر، السعودية.",
    en: "🏆 **Currently programmed teams in preliminary groups:**\n• **Group A:** Mexico, Canada, USA\n• **Group B:** Argentina, France, Brazil, Morocco, Egypt, Saudi Arabia."
};

// 6️⃣ تسجيل الأوامر عند تشغيل البوت
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Version: ${BOT_VERSION}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('عرض قائمة المساعدة والدعم لغتين / Show help menu'),
        
        new SlashCommandBuilder()
            .setName('teams')
            .setDescription('عرض الفرق المشاركة بكأس العالم / Show participating teams'),

        new SlashCommandBuilder()
            .setName('guess-flag')
            .setDescription('شغل لعبة تخمين العلم (عربي/إنجليزي)'),

        new SlashCommandBuilder()
            .setName('countdown')
            .setDescription('العد التنازلي لافتتاح كأس العالم / World Cup Countdown'),

        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('عرض قائمة متصدري لعبة التخمين / Show Leaderboard'),

        new SlashCommandBuilder()
            .setName('embed')
            .setDescription('إرسال رسالة إمبد مخصصة (للإدارة فقط)')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addStringOption(opt => opt.setName('title').setDescription('عنوان الرسالة').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('محتوى أو نص الرسالة').setRequired(true))
            .addStringOption(opt => opt.setName('color').setDescription('اللون بالهكس مثال: #ff0000').setRequired(false))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully registered all Slash Commands.');
    } catch (error) {
        console.error(error);
    }
});

// 7️⃣ دالة تشغيل لعبة التخمين (مفصولة لتشغيلها بالـ Slash وبالاختصار)
async function startFlagGame(channel, replyTarget = null) {
    if (activeGames.has(channel.id)) {
        const msg = '❌ هناك لعبة قائمة بالفعل في هذه القناة!';
        return replyTarget ? replyTarget.editReply({ content: msg }) : channel.send(msg);
    }

    activeGames.add(channel.id);
    const chosen = gameData[Math.floor(Math.random() * gameData.length)];

    const gameEmbed = new EmbedBuilder()
        .setTitle('🤔 خمن اسم الدولة صاحبة هذا العلم / Guess the Country!')
        .setDescription('⏱️ لديك **15 ثانية** فقط للإجابة الصحيحة!\nYou have **15 seconds** to answer! (العربية / English)')
        .setImage(chosen.flagUrl)
        .setColor(0xE67E22)
        .setFooter({ text: `${BOT_NAME} v${BOT_VERSION}` });

    if (replyTarget) {
        await replyTarget.editReply({ embeds: [gameEmbed] });
    } else {
        await channel.send({ embeds: [gameEmbed] });
    }

    // مجمع الرسائل: يقبل الإجابة سواء كانت بالعربي أو بالإنجليزي (تجاهل حالة الأحرف للإنجليزي)
    const filter = res => {
        const ans = res.content.trim().toLowerCase();
        return ans === chosen.countryAr || ans === chosen.countryEn;
    };

    const collector = channel.createMessageCollector({ filter, time: 15000, max: 1 });
    let won = false;

    collector.on('collect', async m => {
        won = true;
        
        // إضافة نقطة للاعب في قاعدة البيانات
        const userId = m.author.id;
        const username = m.author.username;
        
        const row = db.prepare('SELECT points FROM users WHERE userId = ?').get(userId);
        if (row) {
            db.prepare('UPDATE users SET points = points + 1, username = ? WHERE userId = ?').run(username, userId);
        } else {
            db.prepare('INSERT INTO users (userId, username, points) VALUES (?, ?, 1)').run(userId, username);
        }

        const successEmbed = new EmbedBuilder()
            .setTitle('🎉 إجابة صحيحة / Correct Answer!')
            .setDescription(`🏆 البطل **${m.author}** عرف الإجابة!\nالدولة هي: **${chosen.countryAr}** | **${chosen.countryEn.toUpperCase()}**\nتم إضافة +1 نقطة إلى رصيدك!`)
            .setColor(0x2ECC71)
            .setThumbnail(chosen.flagUrl);
        
        await channel.send({ embeds: [successEmbed] });
        collector.stop();
    });

    collector.on('end', () => {
        activeGames.delete(channel.id);
        if (!won) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏱️ انتهى الوقت / Time is Up!')
                .setDescription(`الإجابة الصحيحة كانت: **${chosen.countryAr}** / **${chosen.countryEn.toUpperCase()}** 😔`)
                .setColor(0xE74C3C)
                .setThumbnail(chosen.flagUrl);
            channel.send({ embeds: [timeoutEmbed] });
        }
    });
}

// 8️⃣ استقبال رسائل الشات العادية واختصار اللعبة (.w)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // اختصار لعبة احزر العلم
    if (message.content.trim().toLowerCase() === '.w') {
        await startFlagGame(message.channel);
    }
});

// 9️⃣ معالجة أوامر الـ Slash Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, channel } = interaction;

    // أمر المساعدة بدعم اللغتين
    if (commandName === 'help') {
        await interaction.deferReply();
        const helpEmbed = new EmbedBuilder()
            .setTitle(`📖 قائمة مساعدة ${BOT_NAME}`)
            .setDescription(`مرحباً بك! إليك الأوامر المتاحة في الإصدار ${BOT_VERSION}:`)
            .addFields(
                { name: '⚽ أوامر كأس العالم', value: '`/teams` - عرض الفرق المشاركة\n`/countdown` - مؤقت الافتتاح التنازلي', inline: true },
                { name: '🎮 ألعاب وتسلية', value: '`/guess-flag` أو الاختصار `.w` - بدء اللعبة\n`/leaderboard` - قائمة المتصدرين', inline: true },
                { name: '🛠️ الإدارة', value: '`/embed` - إرسال رسالة إمبد منسقة', inline: false }
            )
            .setColor(0x9B59B6)
            .setFooter({ text: `Requested by ${interaction.user.username}` });
        await interaction.editReply({ embeds: [helpEmbed] });
    }

    // أمر الأفرقة المشاركة
    if (commandName === 'teams') {
        await interaction.deferReply();
        const teamsEmbed = new EmbedBuilder()
            .setTitle('🌍 الفرق المشاركة / Participating Teams')
            .setDescription(`${teamsData.ar}\n\n${teamsData.en}`)
            .setColor(0x1ABC9C);
        await interaction.editReply({ embeds: [teamsEmbed] });
    }

    // أمر بدء لعبة التخمين
    if (commandName === 'guess-flag') {
        await interaction.deferReply();
        await startFlagGame(channel, interaction);
    }

    // أمر العد التنازلي
    if (commandName === 'countdown') {
        await interaction.deferReply();
        const worldCupDate = new Date('2026-06-11T18:00:00Z');
        const difference = worldCupDate - new Date();

        if (difference <= 0) {
            return interaction.editReply({ content: '🎉 انطلقت بطولة كأس العالم 2026 بالفعل الآن! ⚽🏆' });
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const cdEmbed = new EmbedBuilder()
            .setTitle('🏆 العداد التنازلي لكأس العالم 2026 ⚽')
            .addFields({ 
                name: '⏳ المتبقي على مباراة الافتتاح في المكسيك:', 
                value: `**${days}** يوم و **${hours}** ساعة و **${minutes}** دقيقة و **${seconds}** ثانية` 
            })
            .setColor(0x3498DB)
            .setFooter({ text: `${BOT_NAME}` });
        await interaction.editReply({ embeds: [cdEmbed] });
    }

    // أمر المتصدرين (Leaderboard)
    if (commandName === 'leaderboard') {
        await interaction.deferReply();
        const rows = db.prepare('SELECT username, points FROM users ORDER BY points DESC LIMIT 10').all();

        if (rows.length === 0) {
            return interaction.editReply({ content: '📊 لا توجد نقاط مسجلة حتى الآن، كن أول من يفوز باستخدام `.w`!' });
        }

        let description = "🏆 **أعلى 10 لاعبين في لوحة الصدارة:**\n\n";
        rows.forEach((row, index) => {
            let medal = `${index + 1}.`;
            if (index === 0) medal = '🥇';
            if (index === 1) medal = '🥈';
            if (index === 2) medal = '🥉';
            description += `${medal} **${row.username}** — \`${row.points}\` نقطة/Points\n`;
        });

        const lbEmbed = new EmbedBuilder()
            .setTitle('📊 لوحة صدارة لعبة التخمين / Leaderboard')
            .setDescription(description)
            .setColor(0xF1C40F)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/3112/3112946.png');
        await interaction.editReply({ embeds: [lbEmbed] });
    }

    // أمر إرسال رسائل إمبد (Embed Creator)
    if (commandName === 'embed') {
        await interaction.deferReply({ ephemeral: true });
        
        const title = options.getString('title');
        const desc = options.getString('description');
        let colorInput = options.getString('color') || '#3498db';
        
        // تنظيف وحل صيغة اللون ليقبله الديسكورد
        colorInput = colorInput.replace('#', '');
        const finalColor = parseInt(colorInput, 16) || 0x3498DB;

        const customEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor(finalColor)
            .setFooter({ text: `${BOT_NAME} • نظام النشر` })
            .setTimestamp();

        // إرسال الإمبد مباشرة في القناة
        await channel.send({ embeds: [customEmbed] });
        await interaction.editReply({ content: '✅ تم إرسال رسالة الإمبد بنجاح!' });
    }
});

client.login(process.env.TOKEN);
