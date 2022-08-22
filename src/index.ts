import dotenv from 'dotenv'
dotenv.config()
import type { Conn } from '@rob9315/mcproxy'
import { pathfinder as pathfinderInject } from 'mineflayer-pathfinder'
import { InspectorProxy } from 'mineflayer-proxy-inspector'
import { inject as antiHungerCoreInject } from './modules/antiHunger'
import { inject as autoEat } from './modules/autoEat'
import { inject as antiAfk } from './modules/afk'
import { readFileSync } from 'fs'

let allowList: string[] = []
try {
  allowList = readFileSync('./config/allowList.txt', 'utf8').split('\n')
} catch (err) {
  console.error('Reading allowlist failed')
}

function loadPlugins(conn: Conn) {
  antiHungerCoreInject(conn)
  conn.bot.loadPlugins([
    pathfinderInject, antiAfk, autoEat
  ])
}

let proxy: InspectorProxy | undefined

proxy = new InspectorProxy({
  host: process.env.HOST ?? '2b2t.org',
  // port: 25567,
  username: process.env.EMAIL ?? 'testBot',
  auth: process.env.EMAIL ? 'microsoft' : 'offline',
  version: '1.12.2',
  skipValidation: process.env.EMAIL ? true : false,
  profilesFolder: 'nmp-cache',
  port: Number(process.env.PORT ?? 25565),
}, {
  security: {
    onlineMode: true,
    allowList: allowList
  },
  botStopOnLogoff: false,
  botAutoStart: true,
  linkOnConnect: true,
  // @ts-ignore
  port: Number(process.env.SERVERPORT ?? 25565)
})

proxy.on('botReady', (conn) => {
  let spawnedTime = new Date()
  loadPlugins(conn)
  const bot = conn.bot
  bot.proxy.emitter.on('proxyBotLostControl', () => {
    bot.antiHunger.off()
  })

  setTimeout(() => {
    console.info('Starting anti afk')
    bot.afkController.start()
  }, 3000)

  setInterval(() => {
    bot.swingArm('right')
  }, 10000)

  bot.on('error', (err) => console.error('Bot error', err))
  bot.on('kicked', console.error)
  bot.on('spawn', () => {
    spawnedTime = new Date()
    console.info('Bot spawned')
  })
  bot.on('end', () => {
    let now = new Date()
    const hoursConnected = (now.getTime() - spawnedTime.getTime()) / (1000 * 60 * 60)
    console.info(`Bot was connected for ${hoursConnected.toFixed(2)} hours`, now)
    proxy?.stopBot()
  })
})

proxy.on('clientConnect', async () => {
  if (!proxy) {
    console.info('Client connected but proxy not ready')
    return
  }
})

process.once('SIGINT', () => {
  proxy?.stopBot()
  proxy?.stopServer()
  process.kill(process.pid, 'SIGINT')
})
