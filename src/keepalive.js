import express from 'express'

export function startKeepAlive() {
  const app = express()

  app.get('/', (_, res) => {
    res.send('OK')
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log('Keep-alive listening on port', port)
  })
}
