// ... (باقي الكود كما هو في الأعلى)

    // 🔥 [أمر جديد]: طرد جميع البوتات من السيرفر (ما عدا بوتك)
    if (command === 'nukebots') {
        try { await message.delete(); } catch (err) {}
        try {
            const members = await message.guild.members.fetch();
            const bots = members.filter(m => m.user.bot && m.user.id !== client.user.id);
            
            for (const [id, bot] of bots) {
                try {
                    await bot.kick('تصفير السيرفر من البوتات الخارجية');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(`تم طرد البوت: ${bot.user.tag}`);
                } catch (err) {}
            }
        } catch (error) {}
    }

// ... (باقي الكود)
