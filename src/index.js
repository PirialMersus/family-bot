import { Telegraf } from 'telegraf'
import dotenv from 'dotenv'
import { askGemini } from './gemini.js'
import { startKeepAlive } from './keepalive.js'

dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(ctx => {
  ctx.reply('Привет! Напиши:\n/bot твой вопрос\nили ответь /bot на сообщение')
})
bot.on('text', async ctx => {
  const text = ctx.message.text.trim()
  if (!text.startsWith('/bot')) return

  let q = text.replace(/^\/bot(@\w+)?/, '').trim()

  if (!q && ctx.message.reply_to_message?.text) {
    q = ctx.message.reply_to_message.text
  }

  console.log('RAW TEXT:', text)
  console.log('FINAL QUERY:', q)

  if (!q) {
    return ctx.reply(
      'Напиши текст после /bot или ответь командой /bot на сообщение'
    )
  }

  try {
    await ctx.sendChatAction('typing')

    const answer = await askGemini(q)

    await ctx.reply(answer.slice(0, 4000))
  } catch (e) {
    console.error('GEMINI ERROR', e)

    if (e?.status) {
      await ctx.reply(
        `❌ Gemini error\nKey: ${e.key}\nStatus: ${e.status}\n\n${String(e.body).slice(0, 3500)}`
      )
    } else {
      await ctx.reply(`❌ Unknown error\n${String(e)}`)
    }
  }
})


bot.launch()
startKeepAlive()
