export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Tap To Paisa Bot is running!');

  const token = "8922827316:AAHBkPk6rQJWPQ41iV9jTpQtABChyux6iyM";
  const webAppUrl = "https://" + "notcoin-telegram-mini-app-clone-omega.vercel.app";
  
  const update = req.body;

  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;

    let replyText = "";
    let replyMarkup = {
      keyboard: [
        [{ text: "🎮 Play Game", web_app: { url: webAppUrl } }],
        [{ text: "📜 Transaction History" }, { text: "👥 Refer and Earn" }],
        [{ text: "🎧 Customer Support" }]
      ],
      resize_keyboard: true
    };

    if (text.startsWith("/start")) {
      replyText = `💰 *Welcome to Tap To Paisa Official!*\n\n🪙 Tap coins, watch short ads, unlock 5 daily mystery scratch cards, and earn real rewards!\n💵 *₹20 Welcome Bonus + ₹10 Loyalty Cashback*\n\n👇 Tap *Play Game* below to start earning now!\n\n🧱 *More Earning Game (Block Paisa):*\nhttps://t.me{chatId}`;
    } else if (text === "📜 Transaction History") {
      replyText = "📜 *Transaction History*\n\nOpen the game and tap on *📜 History* at the top-right to view your withdrawals, loyalty cashback, and bonus records!";
    } else if (text === "👥 Refer and Earn") {
      replyText = `👥 *Squad Invite Bonus!*\n\nEarn *₹3.00 Bonus* for every friend who joins via your link and completes a 7-Day Streak:\n\`https://t.me{chatId}\``;
    } else if (text === "🎧 Customer Support") {
      replyText = "🎧 *Customer Support*\n\nNeed help with withdrawals or redeem codes? Message our official support team:\n👉 @Game_Developer07";
    }

    if (replyText) {
    await fetch("https://" + "api.telegram.org/bot" + token + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "Markdown",
          reply_markup: replyMarkup
        })
      });
    }
  }

  return res.status(200).json({ ok: true });
}
