import 'dotenv/config'
import axios from 'axios'

const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3
].filter(Boolean)

if (!GEMINI_KEYS.length) {
  throw new Error('No GEMINI keys provided')
}

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_TIMEOUT_MS = 60000

let keyIndex = 0

function nextKey() {
  const key = GEMINI_KEYS[keyIndex]
  keyIndex = (keyIndex + 1) % GEMINI_KEYS.length
  return key
}

function buildPrompt(userText) {
  return `
Ты — помощник для семейного Telegram-чата.

Тебе могут задавать ЛЮБЫЕ вопросы:
бытовые, жизненные, про здоровье, отношения, детей, работу, эмоции, решения.

Твоя задача — отвечать:
- спокойно
- по-человечески
- лаконично
- без лекций и воды

Правила:
- не пиши длинных вступлений
- не используй канцелярит и ИИ-пафос
- не перегружай деталями
- не поучай и не морализируй

Формат:
- 2–6 коротких абзацев ИЛИ
- короткие пункты, только если это действительно уместно
- используй эмодзи (особенно в начале пунктов)

Ограничение:
- ответ должен читаться с телефона за 20–30 секунд
- если ответ получается длинным — сократи его в 2 раза без потери смысла

Вопрос:
"${userText}"
`.trim()
}

export async function askGemini(userText) {
  let lastError

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const keyNumber = keyIndex + 1
    const key = nextKey()

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${GEMINI_MODEL}:generateContent?key=${key}`

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(userText) }]
        }
      ]
    }

    console.log('➡️ GEMINI REQUEST TEXT:', userText)

    try {
      const res = await axios.post(url, body, { timeout: GEMINI_TIMEOUT_MS })

      console.log('⬅️ GEMINI RESPONSE:', res.data)

      const text =
        res.data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        lastError = {
          key: keyNumber,
          status: 'NO_TEXT',
          body: res.data
        }
        continue
      }

      return text.trim()
    } catch (e) {
      lastError = {
        key: keyNumber,
        status: e.response?.status || 'REQUEST_ERROR',
        body: e.response?.data || e.message
      }
    }
  }

  throw lastError
}
