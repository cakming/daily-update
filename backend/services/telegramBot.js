import { Telegraf } from 'telegraf';
import User from '../models/User.js';
import DailyUpdate from '../models/Update.js';
import WeeklyUpdate from '../models/Update.js';
import { subDays } from 'date-fns';
import { formatUpdate, truncate, getSummaryMode } from './updateFormatter.js';

/**
 * Telegram Bot Service
 * Handles Telegram bot interactions and commands
 */

let bot = null;

/**
 * Initialize and start Telegram bot
 */
export const startTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log('Telegram bot token not configured. Bot will not start.');
    return null;
  }

  try {
    bot = new Telegraf(token);

    // Start command
    bot.command('start', async (ctx) => {
      const welcomeMessage = `
🤖 Welcome to Daily Update Bot!

I can help you manage your daily updates and weekly summaries.

Available commands:
/help - Show this help message
/link - Link your Telegram account with your Daily Update account
/today - Get today's updates
/week - Get this week's summary
/stats - Get your update statistics
/latest - Get your latest update

To get started, use /link to connect your account.
      `;
      await ctx.reply(welcomeMessage);
    });

    // Help command
    bot.command('help', async (ctx) => {
      const helpMessage = `
📖 Available Commands:

/start - Start the bot and see welcome message
/help - Show this help message
/link - Link your Telegram to your Daily Update account
/today - View today's daily updates
/week - View this week's summary
/stats - View your update statistics
/latest - View your most recent update

Need more help? Visit our documentation or contact support.
      `;
      await ctx.reply(helpMessage);
    });

    // Link account command
    bot.command('link', async (ctx) => {
      const telegramUserId = ctx.from.id.toString();
      const telegramUsername = ctx.from.username || ctx.from.first_name;

      const linkMessage = `
🔗 Link Your Account

To link your Telegram account with Daily Update:

1. Go to your Daily Update web app
2. Navigate to Profile Settings
3. Go to Integrations section
4. Enter this Telegram ID: \`${telegramUserId}\`
5. Click "Link Telegram"

Your Telegram username: @${telegramUsername}
Your Telegram ID: \`${telegramUserId}\`

Once linked, you'll be able to receive updates directly here!
      `;
      await ctx.reply(linkMessage, { parse_mode: 'Markdown' });
    });

    // Today's updates command
    bot.command('today', async (ctx) => {
      try {
        const telegramUserId = ctx.from.id.toString();

        // Find user by Telegram ID
        const user = await User.findOne({ telegramId: telegramUserId });

        if (!user) {
          await ctx.reply(
            '❌ Your Telegram account is not linked. Use /link to connect your account.'
          );
          return;
        }

        // Get today's updates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const updates = await DailyUpdate.find({
          userId: user._id,
          createdAt: { $gte: today },
        })
          .populate('companyId')
          .sort({ createdAt: -1 });

        if (updates.length === 0) {
          await ctx.reply('📝 No updates found for today.');
          return;
        }

        const summaryMode = await getSummaryMode(user._id);
        let message = `📅 Today's Updates (${updates.length}):\n\n`;

        updates.forEach((update, index) => {
          const view = formatUpdate(update, { summaryMode });
          message += `${index + 1}. ${view.companyLabel}\n`;
          if (view.body) {
            message += `📌 ${truncate(view.body, 200)}\n`;
          }
          message += `\n`;
        });

        await ctx.reply(message);
      } catch (error) {
        console.error('Telegram /today command error:', error);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    // Week's summary command
    bot.command('week', async (ctx) => {
      try {
        const telegramUserId = ctx.from.id.toString();

        const user = await User.findOne({ telegramId: telegramUserId });

        if (!user) {
          await ctx.reply(
            '❌ Your Telegram account is not linked. Use /link to connect your account.'
          );
          return;
        }

        const endDate = new Date();
        const startDate = subDays(endDate, 7);

        const summaries = await WeeklyUpdate.find({
          userId: user._id,
          'dateRange.start': { $gte: startDate },
        })
          .populate('companyId')
          .sort({ createdAt: -1 })
          .limit(1);

        if (summaries.length === 0) {
          await ctx.reply('📊 No weekly summary found for this week.');
          return;
        }

        const summaryMode = await getSummaryMode(user._id);
        const view = formatUpdate(summaries[0], { summaryMode });

        let message = `📊 Weekly Summary - ${view.companyLabel}\n\n`;
        if (view.body) {
          message += `📌 ${truncate(view.body, 400)}\n\n`;
        }
        message += `Updates: ${view.dailyUpdatesCount}\n`;

        await ctx.reply(message);
      } catch (error) {
        console.error('Telegram /week command error:', error);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    // Stats command
    bot.command('stats', async (ctx) => {
      try {
        const telegramUserId = ctx.from.id.toString();

        const user = await User.findOne({ telegramId: telegramUserId });

        if (!user) {
          await ctx.reply(
            '❌ Your Telegram account is not linked. Use /link to connect your account.'
          );
          return;
        }

        const [dailyCount, weeklyCount] = await Promise.all([
          DailyUpdate.countDocuments({ userId: user._id }),
          WeeklyUpdate.countDocuments({ userId: user._id }),
        ]);

        const message = `
📊 Your Statistics

📝 Total Daily Updates: ${dailyCount}
📈 Total Weekly Summaries: ${weeklyCount}
👤 Account: ${user.name}
📧 Email: ${user.email}

Keep up the great work! 🎉
        `;

        await ctx.reply(message);
      } catch (error) {
        console.error('Telegram /stats command error:', error);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    // Latest update command
    bot.command('latest', async (ctx) => {
      try {
        const telegramUserId = ctx.from.id.toString();

        const user = await User.findOne({ telegramId: telegramUserId });

        if (!user) {
          await ctx.reply(
            '❌ Your Telegram account is not linked. Use /link to connect your account.'
          );
          return;
        }

        const latestUpdate = await DailyUpdate.findOne({ userId: user._id })
          .populate('companyId')
          .sort({ createdAt: -1 });

        if (!latestUpdate) {
          await ctx.reply('📝 No updates found.');
          return;
        }

        const summaryMode = await getSummaryMode(user._id);
        const view = formatUpdate(latestUpdate, { summaryMode });
        const date = new Date(view.date).toLocaleDateString();

        let message = `📝 Latest Update\n\n`;
        message += `🏢 Company: ${view.companyLabel}\n`;
        message += `📅 Date: ${date}\n\n`;
        message += `Content:\n${truncate(view.body)}`;

        await ctx.reply(message);
      } catch (error) {
        console.error('Telegram /latest command error:', error);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    // Error handling
    bot.catch((err, ctx) => {
      console.error('Telegram bot error:', err);
      ctx.reply('❌ An error occurred. Please try again later.');
    });

    // Start bot
    bot.launch();

    console.log('Telegram bot started successfully');

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
  } catch (error) {
    console.error('Failed to start Telegram bot:', error);
    return null;
  }
};

/**
 * Stop Telegram bot
 */
export const stopTelegramBot = () => {
  if (bot) {
    bot.stop();
    bot = null;
    console.log('Telegram bot stopped');
  }
};

/**
 * Send message to Telegram user
 */
export const sendTelegramMessage = async (telegramId, message) => {
  if (!bot) {
    console.log('Telegram bot not running');
    return false;
  }

  try {
    await bot.telegram.sendMessage(telegramId, message);
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};

export default {
  startTelegramBot,
  stopTelegramBot,
  sendTelegramMessage,
};
