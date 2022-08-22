import type { Conn } from '@rob9315/mcproxy'

interface AntiHungerPlugin {
  on(): void
  off(): void
  active: boolean
  allPackets: boolean
}

declare module 'mineflayer' {
  interface Bot {
    antiHunger: AntiHungerPlugin
  }
}

export function inject(conn: Conn) {
  conn.bot.antiHunger = {} as any
  const bot = conn.bot
  conn.optimizePacketWrite = false

  const editIfPosition = (name: string, data: any) => {
    // console.info(`[AntiHunger] Writing ${name}`)
    if (name === 'position' || name === 'position_look') {
      if ((bot.proxy.botHasControl() || bot.antiHunger.allPackets) && bot.antiHunger.active) {
        if (!bot.targetDigBlock) {
          data.onGround = false
          // console.info('Anti hunger intercepting position packets')
        }
      }
    }
  }

  const originalWriteIf = conn.writeIf.bind(conn) 
  const originalWrite = conn.write.bind(conn)
  const originalBotWrite = bot._client.write.bind(bot._client)
  const writeIf = (name: string, data: any) => {   
    editIfPosition(name, data)
    originalWriteIf(name, data)
  }
  const write = (name: string, data: any) => {
    editIfPosition(name, data)
    originalWrite(name, data)
  }
  const botWriteIf = (name: string, data: any) => {
    editIfPosition(name, data)
    originalBotWrite(name, data)
  }
  conn.writeIf = writeIf.bind(conn)
  conn.write = write.bind(conn)
  bot._client.write = botWriteIf.bind(bot._client)

  bot.antiHunger.allPackets = true
  bot.antiHunger.active = true
  bot.antiHunger.on = () => {
    bot.antiHunger.active = true
  }
  bot.antiHunger.off = () => {
    bot.antiHunger.active = false
  }
}
