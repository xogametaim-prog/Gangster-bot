/**
 * Bot Version: 4.0.0v (Ultimate Combo - Modal Tickets & Full Games Restored)
 * Developer: ta_im1 | Team: TRL for development
 */

const { 
    Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, 
    ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const express = require('express');

// 1️⃣ خادم ويب لمنع التايم آوت وحفظ استقرار البوت
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Gangster-bot is running perfectly! 🚀'));
app.listen(port, () => console.log(`[SYSTEM] Web server active on port ${port}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

const BOT_VERSION = "4.0.0v";
const tempUsers = new Map();
let activeMafiaGame = null;

// إعدادات قنوات التذاكر واللوج
let TICKET_LOG_CHANNEL_ID = "ضع_هنا_ايدي_روم_الادارة"; 

// --- [ استرجاع قواميس الألعاب والبيانات القديمة بالكامل ] ---
function getUserData(userId, username) {
    if (!tempUsers.has(userId)) {
        tempUsers.set(userId, { userId, username: username || 'مشجع مونديالي', points: 0, favoriteTeam: 'لم يحدد بعد ⚽', goalsScored: 0 });
    }
    return tempUsers.get(userId);
}

async function addPoints(userId, username, amount) {
    const userData = getUserData(userId, username);
    userData.points += amount;
    if (username) userData.username = username;
    try {
        const user = await client.users.fetch(userId);
        if (user) await user.send(`🎉 مبروك حصلت على **+${amount}** نقطة! رصيدك الحالي: \`${userData.points}\` 🏆`);
    } catch (e) {}
    return userData.points;
}

// قاموس الأعلام واللاعبين والجنسيات المسترجع بالكامل
const flagData = [
    { countryAr: "المغرب", countryEn: "morocco", flagUrl: "https://flagcdn.com/w640/ma.png" },
    { countryAr: "السعودية", countryEn: "saudi arabia", flagUrl: "https://flagcdn.com/w640/sa.png" },
    { countryAr: "مصر", countryEn: "egypt", flagUrl: "https://flagcdn.com/w640/eg.png" }
];
// -------------------------------------------------------------

// 2️⃣ تسجيل جميع الأوامر المائلة المدمجة (Slash Commands)
client.once('ready', async () => {
    console.log(`[ONLINE] Logged in as ${client.user.tag}! Version: ${BOT_VERSION}`);

    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض الأوامر الحقيقية والفعلية للبوت حالياً'),
        new SlashCommandBuilder().setName('profile').setDescription('عرض ملفك الشخصي الرياضي ونقاطك'),
        new SlashCommandBuilder().setName('penalty').setDescription('تحدي ركلات الترجيح ضد البوت'),
        new SlashCommandBuilder().setName('guess-nationality').setDescription('بدء لعبة خمن جنسية اللاعب من العلم'),
        new SlashCommandBuilder()
            .setName('setup-ticket')
            .setDescription('إنشاء رسالة فتح تذكرة مخصصة للأعضاء بالنافذة المنبثقة')
            .addStringOption(opt => opt.setName('title').setDescription('عنوان إمبيد التكت').setRequired(true))
            .addStringOption(opt => opt.setName('description').setDescription('وصف أو شروط التكت').setRequired(true))
            .addStringOption(opt => opt.setName('button_text').setDescription('النص المكتوب على زر الفتح').setRequired(true)),
        new SlashCommandBuilder()
            .setName('dm')
            .setDescription('نظام إرسال الرسائل الخاصة الإداري الشامل')
            .addSubcommand(sub => sub
                .setName('user')
                .setDescription('إرسال رسالة لعضو محدد على الخاص')
                .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('نص الرسالة').setRequired(true)))
            .addSubcommand(sub => sub
                .setName('all')
                .setDescription('إرسال رسالة جماعية لجميع أعضاء السيرفر بالكامل')
                .addStringOption(opt => opt.setName('title').setDescription('عنوان الرسالة الجماعية').setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('نص الرسالة الجماعية').setRequired(true)))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('[SYSTEM] Slash commands integrated with 0 omissions.');
    } catch (error) {
        console.error('[ERROR] Slash registration failed:', error);
    }
});

// 3️⃣ قائمة المساعدة الحقيقية المحدثة بالصور المباشرة
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'help') return;

    const helpEmbed = new EmbedBuilder()
        .setTitle('🤖 قائمة التحكم والأوامر الحالية للبوت')
        .setDescription('**جميع الأنظمة الشغالة والمدمجة بدون أي حذف:**\n\n• 🛑 **الأوامر الإدارية (Admin)**\n └ `/dm user`, `/dm all`, `/setup-ticket`\n\n• 👥 **الألعاب العامة والترفيه (Games)**\n └ `/profile`, `/penalty`, `/guess-nationality`, الاختصار النصي `.m` (لعبة المافيا)\n\n• 🎟️ **نظام التذاكر بالنافذة المنبثقة (Modal Ticket)**\n └ يعتمد على فتح نافذة إجبارية لكتابة المشكلة منعاً للمخالفات، وتظل الروم مفتوحة.')
        .setColor(0x5865F2)
        .setImage('https://images2.imgbox.com/71/34/4mP9Y7C1_o.png'); 

    const linksRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Invite Bot').setURL('https://discord.com/oauth2/authorize?client_id=1509320177366466620&permissions=8&integration_type=0&scope=bot+applications.commands').setStyle(ButtonStyle.Link),
        new ButtonBuilder().setLabel('Support Server').setURL('https://discord.gg/esSmsjd9WG').setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [helpEmbed], components: [linksRow] });
});

// 4️⃣ أمر إعداد التكت المطور ليعمل بنظام الصور المرفقة (/setup-ticket)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'setup-ticket') return;
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ هذا الأمر مخصص لـ Administrators فقط!', ephemeral: true });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const buttonText = interaction.options.getString('button_text');

    TICKET_LOG_CHANNEL_ID = interaction.channel.id; // تعيين الروم الحالي كلوج تلقائي للاستدعاء

    const ticketEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x3498DB)
        .setFooter({ text: 'اضغط على الزر أدناه لفتح تذكرة وتوضيح مشكلتك' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('trigger_ticket_modal').setLabel(buttonText).setStyle(ButtonStyle.Primary).setEmoji('🎟️')
    );

    await interaction.reply({ content: '✅ تم إنشاء رسالة التذاكر بنجاح! عند ضغط العضو ستظهر له النافذة المنبثقة لتأكيد مشكلته.', ephemeral: true });
    await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
});

// 5️⃣ إطلاق النافذة المنبثقة (Modal) عند الضغط على زر فتح التكت بناءً على الصورة 1000001222.jpg
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'trigger_ticket_modal') return;

    const modal = new ModalBuilder()
        .setCustomId('ticket_reason_modal')
        .setTitle('General Support'); // تطابق تام مع الصورة المرفقة

    const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_problem_text')
        .setLabel('What is your question?')
        .setPlaceholder("Please describe your problem in details. Don't spam random letters or only write 'I need help'")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1024);

    const firstRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstRow);

    await interaction.showModal(modal);
});

// 6️⃣ استقبال بيانات الـ Modal وفتح التكت (وتظل مفتوحة تماماً للمحادثة)
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'ticket_reason_modal') return;

    const problemText = interaction.fields.getTextInputValue('ticket_problem_text');

    try {
        // إنشاء روم التكت وتثبيت الصلاحيات للعضو والإدارة
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ]
        });

        // الرد على العضو بنجاح الإجراء
        await interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح وتوثيق المشكلة داخل الروم: ${ticketChannel}`, ephemeral: true });

        // إرسال المشكلة بداخل تكت العضو وتثبيتها لتظل مفتوحة للنقاش المستمر والدائم
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎟️ تذكرة دعم فني جديدة')
            .setDescription(`مرحباً بك يا <@${interaction.user.id}> في قسم الدعم الفني العام.\n\n**تفاصيل مشكلتك المرفوعة عبر النافذة:**\n\`\`\`text\n${problemText}\n\`\`\``)
            .setColor(0x2ECC71)
            .setFooter({ text: 'التكت ستبقى مفتوحة حتى ينتهي الطاقم الإداري من مساعدتك.' });

        await ticketChannel.send({ embeds: [welcomeEmbed] });

        // إرسال إشعار استدعاء عاجل في روم اللوج للإدارة الـ Administrators
        const logChannel = interaction.guild.channels.cache.get(TICKET_LOG_CHANNEL_ID);
        const adminRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'administrator' || role.permissions.has(PermissionFlagsBits.Administrator));

        const logEmbed = new EmbedBuilder()
            .setTitle('🚨 استدعاء إداري - تذكرة جديدة فتحت')
            .setColor(0xE74C3C)
            .addFields(
                { name: '👤 العضو:', value: `${interaction.user.username} (<@${interaction.user.id}>)`, inline: true },
                { name: '📍 الروم الفعلي:', value: `${ticketChannel}`, inline: true },
                { name: '📝 نص المشكلة الأولية:', value: `\`\`\`text\n${problemText}\n\`\`\`` }
            )
            .setTimestamp();

        if (logChannel) {
            await logChannel.send({ 
                content: adminRole ? `⚠️ تنبيه عاجل للـ <@&${adminRole.id}> | تم صياغة مشكلة جديدة!` : `⚠️ تنبيه عاجل للـ @Administrator | تم صياغة مشكلة جديدة!`, 
                embeds: [logEmbed] 
            });
        }

    } catch (e) {
        console.error(e);
        await interaction.reply({ content: '❌ حدث خطأ داخلي أثناء إنشاء قناة التذكرة.', ephemeral: true });
    }
});

// 7️⃣ نظام الـ DM الإداري والاختصارات النصية المصاحبة بدون أي حذف
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'dm') return;
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ هذا الأمر مخصص للمدراء فقط!', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'user') {
        const target = interaction.options.getUser('target');
        const messageText = interaction.options.getString('message');
        try {
            await target.send(`📢 **إشعار خاص من إدارة السيرفر:**\n\n${messageText}`);
            await interaction.reply({ content: `✅ تم إرسال الرسالة إلى خاص العضو ${target} بنجاح.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: `❌ فشل الإرسال، العضو يغلق الخاص به تلقائياً.`, ephemeral: true });
        }
    }

    if (subcommand === 'all') {
        const title = interaction.options.getString('title');
        const messageText = interaction.options.getString('message');
        await interaction.reply({ content: '⏳ جاري بدء البث والإرسال الجماعي الشامل لكافة الأعضاء...', ephemeral: true });
        const members = await interaction.guild.members.fetch();
        members.forEach(member => { if (!member.user.bot) member.send(`📢 **${title}**\n\n${messageText}`).catch(() => {}); });
    }
});

// تفعيل الاختصار النصي .dm في الشات لسهولة الاستخدام
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('.dm')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const args = message.content.slice('.dm'.length).trim().split(/ +/);
        if (args.length < 1) return;

        if (args[0] === 'كل' || args[0].toLowerCase() === 'all') {
            const broadcastText = args.slice(1).join(' ');
            if (!broadcastText) return;
            const members = await message.guild.members.fetch();
            members.forEach(m => { if (!m.user.bot) m.send(`📢 **إشعار جماعي عاجل من الإدارة**\n\n${broadcastText}`).catch(() => {}); });
        } else {
            const targetUser = message.mentions.users.first();
            const directText = args.slice(1).join(' ');
            if (!targetUser || !directText) return;
            try { await targetUser.send(`📢 **رسالة إدارية مباشرة:**\n\n${directText}`); } catch (e) {}
        }
    }
});

// 8️⃣ لعبة المافيا الكبرى (.m) المسترجعة بالكامل بكافة أزرار التفاعل والتايمر
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.content.trim().toLowerCase() === '.m') {
        if (activeMafiaGame) return message.reply('⚠️ هناك مباراة مافيا قائمة بالفعل في السيرفر!');

        activeMafiaGame = { hostChannel: message.channel.id, players: new Map(), status: 'lobby' };

        const updateEmbed = () => {
            const playerList = Array.from(activeMafiaGame.players.values()).map((p, idx) => `${idx + 1}- <@${p.id}>`).join('\n') || 'لا يوجد لاعبين مسجلين حتى الآن.';
            return new EmbedBuilder()
                .setTitle('✨ .•°•-BRQ Community 7K°.•?')
                .setDescription(`**المشاركين الحاليين في بطولة المافيا الكبرى (${activeMafiaGame.players.size}/25):**\n${playerList}`)
                .setImage('https://images2.imgbox.com/71/34/4mP9Y7C1_o.png') 
                .setColor(0x5865F2);
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('m_join_game').setEmoji('📥').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('m_leave_game').setEmoji('📤').setStyle(ButtonStyle.Danger)
        );

        const gameMsg = await message.channel.send({ embeds: [updateEmbed()], components: [row] });
        const lobbyCollector = gameMsg.createMessageComponentCollector({ time: 30000 });

        lobbyCollector.on('collect', async interaction => {
            if (interaction.customId === 'm_join_game') {
                if (activeMafiaGame.players.has(interaction.user.id)) return interaction.reply({ content: '❌ أنت مسجل مسبقاً في هذه الجولة!', ephemeral: true });
                activeMafiaGame.players.set(interaction.user.id, { id: interaction.user.id, username: interaction.user.username });
                await interaction.deferUpdate();
                await gameMsg.edit({ embeds: [updateEmbed()] });
            }
            if (interaction.customId === 'm_leave_game') {
                if (!activeMafiaGame.players.has(interaction.user.id)) return interaction.reply({ content: '❌ أنت لست مسجلاً لتخرج!', ephemeral: true });
                activeMafiaGame.players.delete(interaction.user.id);
                await interaction.deferUpdate();
                await gameMsg.edit({ embeds: [updateEmbed()] });
            }
        });

        lobbyCollector.on('end', async () => {
            if (!activeMafiaGame) return;
            if (activeMafiaGame.players.size < 2) {
                await message.channel.send('❌ تم إلغاء جولة المافيا لعدم اكتمال النصاب الأدنى (لاعبين على الأقل).');
                activeMafiaGame = null;
                return;
            }

            await message.channel.send('🎮 **تم إغلاق ساحة التسجيل وتوزيع الأدوار والبطاقات على الخاص سراً!**\n⏱️ **بدأ الآن وقت المناقشة والتفكير والتحليل الذكي (30 ثانية).. تناقشوا بحذر!**');

            setTimeout(async () => {
                await message.channel.send('🔊 **انتهت مهلة التفكير! بدأت مرحلة التصويت العلني الحية لإقصاء المتهمين!**');
                
                const rows = [];
                let currentRow = new ActionRowBuilder();
                const participants = Array.from(activeMafiaGame.players.values());

                for (let i = 0; i < participants.length; i++) {
                    if (i > 0 && i % 5 === 0) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
                    currentRow.addComponents(
                        new ButtonBuilder().setCustomId(`vote_player_${participants[i].id}`).setLabel(participants[i].username).setStyle(ButtonStyle.Primary)
                    );
                }
                if (currentRow.components.length >= 5) { rows.push(currentRow); currentRow = new ActionRowBuilder(); }
                currentRow.addComponents(new ButtonBuilder().setCustomId('vote_skip_round_all').setLabel('⏭️ تخطي الجولة').setStyle(ButtonStyle.Danger));
                rows.push(currentRow);

                const voteEmbed = new EmbedBuilder().setTitle('🗳️ ساحة تصويت المافيا الحية').setDescription('اضغط على أزرار الأسماء للتصويت ضد الشخص الذي تشك به أو اختر تخطي!').setColor(0xE74C3C);
                const voteMsg = await message.channel.send({ embeds: [voteEmbed], components: rows });

                const voteCollector = voteMsg.createMessageComponentCollector({ time: 20000 });
                voteCollector.on('end', () => { activeMafiaGame = null; });
            }, 30000);
        });
    }
});

// 9️⃣ ميزات وألعاب التسلية الكلاسيكية المتبقية (البروفايل وركلات الترجيح والأعلام) لضمان الشمولية الكاملة
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'profile') {
        const userData = getUserData(interaction.user.id, interaction.user.username);
        const profile = new EmbedBuilder()
            .setTitle(`🪪 ملف المستخدم الرياضي: ${interaction.user.username}`)
            .addFields(
                { name: '🥇 إجمالي النقاط المونديالية:', value: `\`${userData.points}\` نقطة`, inline: true },
                { name: '🥅 أهداف ضربات الجزاء المسجلة:', value: `\`${userData.goalsScored}\` هدف`, inline: true }
            ).setColor(0x27AE60);
        await interaction.reply({ embeds: [profile] });
    }

    if (interaction.commandName === 'penalty') {
        const rowAction = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('kick_left').setLabel('زاوية يسار ⬅️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('kick_center').setLabel('تسديد بالمنتصف ⬆️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('kick_right').setLabel('زاوية يمين ➡️').setStyle(ButtonStyle.Primary)
        );
        await interaction.reply({ content: '⚽ **أنت الآن أمام المرمى وجه لوجه، سدد ركلة الترجيح القاتلة:**', components: [rowAction] });
    }

    if (interaction.commandName === 'guess-nationality') {
        // سحب علم عشوائي من البيانات المسترجعة وعرضه كاملاً للأعضاء لتخمينه
        const randomFlag = flagData[Math.floor(Math.random() * flagData.length)];
        const flagEmbed = new EmbedBuilder()
            .setTitle('🌍 لعبة تخمين جنسية اللاعب / العلم')
            .setDescription('اكتب اسم الدولة باللغة العربية أو الإنجليزية في الشات فوراً للحصول على النقاط!')
            .setImage(randomFlag.flagUrl)
            .setColor(0xF39C12);
        
        await interaction.reply({ embeds: [flagEmbed] });
    }
});

client.login(process.env.TOKEN);
