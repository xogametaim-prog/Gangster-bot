const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');

// إعداد خادم ويب صغير لمنصة Render للحفاظ على استمرارية البوت
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Gangster Bot Is Online!'));
app.listen(port, () => console.log(`Web server listening on port ${port}`));

// إنشاء العميل مع النوايا المطلوبة لقراءة الرسائل في الشات
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// قائمة عينات للأعلام والدول (يمكنك التعديل عليها وزيادتها)
const gameData = [
    { country: "المغرب", flagUrl: "https://flagcdn.com/w640/ma.png" },
    { country: "السعودية", flagUrl: "https://flagcdn.com/w640/sa.png" },
    { country: "مصر", flagUrl: "https://flagcdn.com/w640/eg.png" },
    { country: "الأرجنتين", flagUrl: "https://flagcdn.com/w640/ar.png" },
    { country: "فرنسا", flagUrl: "https://flagcdn.com/w640/fr.png" },
    { country: "البرازيل", flagUrl: "https://flagcdn.com/w640/br.png" }
];

// مصفوفة لتخزين الغرف النشطة لمنع تداخل الألعاب
const activeGames = new Set();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // تسجيل الأوامر المدعومة بالـ Slash Commands
    const commands = [
        new SlashCommandBuilder()
            .setName('احزر-العلم')
            .setDescription('شغل لعبة تخمين علم الدولة في الشات'),
        new SlashCommandBuilder()
            .setName('مونديال-2026')
            .setDescription('حساب الوقت المتبقي لافتتاح كأس العالم 2026 في المكسيك')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, channelId } = interaction;

    // 1️⃣ أمر لعبة احزر العلم
    if (commandName === 'احزر-العلم') {
        if (activeGames.has(channelId)) {
            return interaction.reply({ content: '❌ هناك لعبة قائمة بالفعل في هذه القناة، انتظر حتى تنتهي!', ephemeral: true });
        }

        // تفادي خطأ الـ 3 ثواني (تنتهي صلاحية التفاعل)
        await interaction.deferReply();

        activeGames.add(channelId);

        // اختيار عشوائي للدولة والعلم
        const chosen = gameData[Math.floor(Math.random() * gameData.length)];

        const gameEmbed = new EmbedBuilder()
            .setTitle('🤔 خمن اسم الدولة صاحبة هذا العلم في الشات!')
            .setDescription('⏱️ لديك **15 ثانية** فقط للإجابة الصحيحة قبل انتهاء الوقت!')
            .setImage(chosen.flagUrl)
            .setColor(0xE67E22)
            .setFooter({ text: 'Gangster Bot • لعبة التخمين' });

        // إرسال اللعبة بعد الـ Defer
        await interaction.editReply({ embeds: [gameEmbed] });

        // إنشاء مجمع رسائل (Message Collector) لمراقبة الشات لمدة 15 ثانية
        const filter = response => response.content.trim() === chosen.country;
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        let won = false;

        collector.on('collect', async m => {
            won = true;
            const successEmbed = new EmbedBuilder()
                .setTitle('🎉 إجابة صحيحة وفائز جديد!')
                .setDescription(`البطل **${m.author}** عرف الإجابة الصحيحة وهي: **${chosen.country}** 🏆`)
                .setColor(0x2ECC71)
                .setThumbnail(chosen.flagUrl);
            
            await interaction.followUp({ embeds: [successEmbed] });
            collector.stop();
        });

        collector.on('end', async () => {
            activeGames.delete(channelId);
            if (!won) {
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏱️ انتهى الوقت!')
                    .setDescription(`لأسف لم يعرف أحد الإجابة الصحيحة في الوقت المحدد. 😔\n\nالدولة الصحيحة كانت: **${chosen.country}**`)
                    .setColor(0xE74C3C)
                    .setThumbnail(chosen.flagUrl);

                await interaction.followUp({ embeds: [timeoutEmbed] });
            }
        });
    }

    // 2️⃣ أمر العد التنازلي لكأس العالم 2026
    if (commandName === 'مونديال-2026') {
        await interaction.deferReply();

        // تاريخ افتتاح كأس العالم: 11 يونيو 2026
        const worldCupDate = new Date('2026-06-11T18:00:00Z'); 
        const now = new Date();
        const difference = worldCupDate - now;

        if (difference <= 0) {
            return interaction.editReply({ content: '🎉 أهلاً بكم في 2026! بطولة كأس العالم قد انطلقت بالفعل الآن في ملاعب المكسيك، أمريكا، وكندا! ⚽🏆' });
        }

        // تحويل الفارق الزمني إلى أيام وساعات ودقائق وثواني
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const countdownEmbed = new EmbedBuilder()
            .setTitle('🏆 العداد التنازلي لبطولة كأس العالم 2026 ⚽')
            .setDescription('المباراة الافتتاحية ستنطلق في العاصمة المكسيكية بملعب أزتيكا التاريخي العريق!')
            .addFields(
                { name: '⏳ الوقت المتبقي للبطولة:', value: `**${days}** يوم و **${hours}** ساعة و **${minutes}** دقيقة و **${seconds}** ثانية`, inline: false }
            )
            .setColor(0x3498DB)
            .setThumbnail('https://flagcdn.com/w640/mx.png') // علم المكسيك كشعار للافتتاح
            .setFooter({ text: 'Gangster Bot • World Cup 2026' });

        await interaction.editReply({ embeds: [countdownEmbed] });
    }
});

client.login(process.env.TOKEN);
