import https from "https";

function sendTelegram(token, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: "/bot" + token + "/sendMessage",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", resolve);
      }
    );
    req.on("error", resolve);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("Tap To Paisa Bot is running!");
    }

    const token = "8922827316:AAHBkPk6rQJWPQ41iV9jTpQtABChyux6iyM";
    const webAppUrl = "https://" + "notcoin-telegram-mini-app-clone-omega.vercel.app";
    const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      let replyText = "";
      const replyMarkup = {
        keyboard: [
          [{ text: "🎮 Play Game", web_app: { url: webAppUrl } }],
          [{ text: "📜 Rules" }, { text: "👥 Refer and Earn" }],
          [{ text: "🎧 Customer Support" }],
        ],
        resize_keyboard: true,
      };

      if (text.startsWith("/start")) {
        replyText = [
          "💰 *Welcome to Tap To Paisa Official!*",
          "",
          "🪙 Tap coins, watch short ads, unlock 5 daily mystery scratch cards, and earn real rewards!",
          "💵 *₹20 Welcome Bonus + ₹10 Loyalty Cashback*",
          "",
          "👇 Tap *Play Game* below to start earning now!",
          "",
          "🧱 *More Earning Game (Block Paisa):*",
          "https://" + "t.me/BlockPaisaGame_bot?start=" + chatId,
        ].join("\n");
      } else if (text === "📜 Rules") {
        replyText = [
          "📜 *Tap To Paisa — Official Rules*",
          "",
          "• ⚡ *Daily Tap:* 1,000 free energy daily (+₹0.001/tap)",
          "• 📺 *Watch Ads:* Up to 50 ads daily (+₹0.025/ad)",
          "• 🎁 *Scratch Cards:* 5 daily mystery cards (Up to ₹0.25!)",
          "• 🔥 *7-Day Streak:* Complete 50 ads daily for 7 days (2-day grace chance) = *₹3.00 Bonus*",
          "• 🧱 *Cross-Game Combo Bonus:* Play our 2nd game (*Block Paisa*) for 7 days and get *₹5.00 Bonus in BOTH games*! 🎉",
          "• 💸 *Withdrawal:* Min ₹50 via UPI or Google Play Store (requires 2 active referrals) + *₹10 Loyalty Cashback* after payout!",
        ].join("\n");
      } else if (text === "👥 Refer and Earn") {
        replyText = [
          "👥 *Squad Invite Bonus!*",
          "",
          "Earn *₹3.00 Bonus* for every friend who joins via your link and completes a 7-Day Streak:",
          "`https://" + "t.me/TapToPaisa_Official_bot?start=" + chatId + "`",
        ].join("\n");
      } else if (text === "🎧 Customer Support") {
        replyText = [
          "🎧 *Customer Support*",
          "",
          "Need help with withdrawals or redeem codes? Message our official support team:",
          "👉 `@Game_Developer07`",
        ].join("\n");
      }

      if (replyText) {
        await sendTelegram(token, {
          chat_id: chatId,
          text: replyText,
          parse_mode: "Markdown",
          reply_markup: replyMarkup,
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
}
