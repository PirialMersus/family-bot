// src/index.js
import { Telegraf } from 'telegraf'
import dotenv from 'dotenv'
import { askGemini } from './gemini.js'
import { startKeepAlive } from './keepalive.js'

dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN)

function logError(scope, err, ctx) {
  const log = {
    scope,
    message: err?.message,
    name: err?.name,
    status: err?.response?.status,
    data: err?.response?.data
      ? JSON.stringify(err.response.data).slice(0, 1000)
      : null,
    user: ctx?.from
      ? {
        id: ctx.from.id,
        username: ctx.from.username,
        first_name: ctx.from.first_name
      }
      : null
  }

  console.error('[BOT ERROR]', log)

  if (err?.stack) {
    console.error(err.stack)
  }
}

bot.start(ctx => {
  ctx.reply('Привет! Напиши:\n"Бот ..."\nили ответь "Бот" на сообщение')
})

bot.on('text', async ctx => {
  const text = ctx.message.text.trim()

  if (!text.toLowerCase().startsWith('бот')) return

  let q = text.slice(3).trim()

  if (!q && ctx.message.reply_to_message?.text) {
    q = ctx.message.reply_to_message.text
  }

  if (!q) {
    return ctx.reply('Напиши: "Бот сделай ..." или ответь словом "Бот"')
  }

  try {
    await ctx.sendChatAction('typing')

    const answer = await askGemini(q)

    await ctx.reply(answer.slice(0, 4000), {
      parse_mode: 'HTML'
    })
  } catch (e) {
    logError('askGemini', e, ctx)

    let msg = '❌ Что-то пошло не так.'

    if (e?.response?.status === 429) {
      msg = '⏳ Слишком много запросов. Попробуй позже.'
    } else if (e?.response?.status >= 500) {
      msg = '🤖 Сервис временно недоступен.'
    }

    await ctx.reply(msg)
  }
})

bot.launch()
startKeepAlive()
