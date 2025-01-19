import { Telegraf } from "telegraf";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN must be provided");
}

if (!process.env.WEBAPP_URL) {
  throw new Error("WEBAPP_URL must be provided");
}

// Initialize bot outside handler to reuse across invocations
const bot = new Telegraf(process.env.BOT_TOKEN);

// Set up command handlers
bot.command("start", async (ctx) => {
  try {
    if (!ctx.chat) {
      await ctx.reply("Error: Could not determine chat context");
      return;
    }

    const chatId = ctx.chat.id;
    const encodedGroupId = Buffer.from(chatId.toString()).toString("base64");

    await ctx.reply(
      "Welcome to Pump Dump! 🚀\n\n" +
        "🔮 Can you predict tomorrow's bitcoin price? Win TON if you're the most accurate! " +
        "Click the button below to get started!",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open App",
                url: `${process.env.WEBAPP_URL}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("Sorry, an error occurred while processing your request.");
  }
});

// Lambda handler
export const handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No request body" }),
      };
    }

    // Parse update from Telegram
    const update = JSON.parse(event.body);

    // Process update
    await bot.handleUpdate(update);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error("Error processing update:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
