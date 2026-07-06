import TelegramBot from 'node-telegram-bot-api'

let bot = null

export function initBot() {
  const token = process.env.BOT_TOKEN
  if (!token || token === 'your_telegram_bot_token_here') {
    console.warn('[Bot] BOT_TOKEN not set — Telegram notifications disabled')
    return null
  }
  bot = new TelegramBot(token)
  console.log('[Bot] Telegram bot initialized')
  return bot
}

export async function notifyAdmin(message) {
  const chatId = process.env.ADMIN_CHAT_ID
  if (!bot || !chatId) return
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
  } catch (e) {
    console.error('[Bot] Failed to send notification:', e.message)
  }
}
