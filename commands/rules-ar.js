const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const economy = require("../utils/economy");

// Pre-configured rules content in Arabic
const RULES_TITLE = "قوانين السيرفر";
const RULES_CONTENT = `قوانين السيرفر
**مرحبًا بك في The Agency عشان نخلي الأجواء ممتعة وآمنة للجميع، فيه شوية قواعد بسيطة لازم نمشي عليها. مخالفتها ممكن تؤدي لعواقب، أولا تحذير ثانيا كتم صوت ثالثا حظر طويل المدي ثم طرد خليك محترم واستمتع بوقتك معنا بدون اي كسر للقواعد**
                                     --------------------------

***1️⃣ خليك محترم – عامل الكل باحترام. لا تتنمر، لا للكراهية، المضايقات، أو أي تصرف عدواني.

2️⃣ ممنوع السبام ، المنشنات لرتب معينه أو تكتب بحروف كبيرة بشكل مزعج. خليك واضح ومرتب.

3️⃣ خلي المحتوى لائق للجميع – أي شيء غير مناسب ممنوع ارساله، سواء صور، أسماء، أو كلام فاضح، ممنوع تمامًا.

4️⃣ ممنوع الترويج الذاتي – لا تعلن عن سيرفرك، حساباتك، أو مشاريعك الخاصة إلا إذا حصلت على إذن من الإدارة او صاحب السيرفير.

5️⃣ احترم شروط استخدام ديسكورد –لازم تلتزم بقوانين ديسكورد العامة وسياسة الاستخدام.

6️⃣ لا تنشر محتوى ضار – ممنوع إرسال روابط لمواقع خبيثة، اختراقات، أو أي شيء غير قانوني.

7️⃣ استخدم القنوات بالشكل الصحيح – كل قناة لها هدف، حاول تلتزم بموضوعها. لو عندك شيء خارج عن السياق، فيه أماكن مخصصة له.

8️⃣ اسمع اوامر الطاقم الإداري– المشرفين والإداريين كلمتهم نهائية. الجدال معهم أو تجاهل التعليمات ممكن يسبب لك مشاكل كبيره.***

**9️⃣**  ***لو اي حد استخدم رول غلط (مثال : لو انت ولد و اخدت رول بنت لاي غرض او العكس هيتم اتخاذ اجرأت صارمه معاه )***

**🔟** ***لو خالف اي قنون من القوانين بتاخد انذار في الاول بعدها تايم اوت بعدها طرد من السيرفير(علي حسب خالفت اني قنون او عملت اني غلط)***

💡 تحتاج مساعدة؟
راسل أي مشرف لو عندك سؤال أو استفسار. ! 🚀`;
const RULES_BANNER = "https://i.postimg.cc/HnNWWGYz/Rules-Bright-AR.jpg";
const RULES_COLOR = "#fcba03";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules-ar")
    .setDescription(
      "Post the server rules in Arabic with pre-configured formatting"
    )
    // Removed Discord permission requirement so all users can see the command
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "Channel to send the rules to (defaults to current channel)"
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Check if user has admin permission
    const hasPermission =
      interaction.user.id === interaction.guild.ownerId ||
      (await economy.hasAdminPermission(interaction.member));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Permission Denied")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    // Create the rules embed - the content is already properly formatted with line breaks
    const rulesEmbed = new EmbedBuilder()
      .setColor(RULES_COLOR)
      .setTitle(RULES_TITLE)
      .setDescription(RULES_CONTENT)
      .setImage(RULES_BANNER)
      .setFooter({
        text: `Posted by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    try {
      // Send the embed to the specified channel
      await channel.send({ embeds: [rulesEmbed] });

      // Confirm to the admin that the embed was sent
      const confirmEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Rules Posted")
        .setDescription(`Arabic server rules have been posted to ${channel}.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error sending Arabic rules embed:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(
          `Failed to send the Arabic rules. Make sure the bot has permission to send messages in ${channel}.`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
