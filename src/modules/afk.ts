import type { Bot } from 'mineflayer'
import { goals, Movements } from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import fs from 'fs/promises'

declare module 'mineflayer' {
  interface Bot {
    afkController: AfkController
  }
}

interface AfkController {
  stop(): void
  start(): void
}

export function inject(bot: Bot) {
  bot.afkController = {} as any

  let intervalTimer: NodeJS.Timeout | undefined = undefined
  let movementMarkers: Vec3[] = []
  const moves = new Movements(bot, require('minecraft-data')(bot.version))
  moves.allow1by1towers = false
  moves.scafoldingBlocks = []
  moves.allowSprinting = false
  moves.canDig = false
  moves.allowParkour = false
  bot.afkController.stop = () => {
    bot.antiHunger.off()
    clearInterval(intervalTimer)
    intervalTimer = undefined
  }

  bot.afkController.start = () => {
    debugger
    if (intervalTimer) return
    const asyncFunc = async () => {
      try {
        const file = `./config/markers.json`
        movementMarkers = (JSON.parse(await fs.readFile(file, 'utf8')) as {x: number, y: number, z: number}[])
          .map(({x, y, z}) => new Vec3(x, y, z))
        if (movementMarkers.length === 0) {
          console.warn('Marker file does not contain any markers')
        }
      } catch (error) {
        console.error('Unable to load markers', error)
      }
    }
    
    asyncFunc().then(() => {
      intervalTimer = setInterval(() => {
        moveAlongMarkers().catch(console.error)
      }, 2 * 60 * 1000)
      moveAlongMarkers().catch(console.error)
    }).catch(console.error)
  }

  const moveAlongMarkers = async () => {
    if (!bot.proxy.botHasControl()) return
    bot.antiHunger.on()
    try {
      const markers = movementMarkers.map(pos => new goals.GoalBlock(pos.x, pos.y, pos.z))
      for (const m of markers) {
        bot.pathfinder.setMovements(moves)
        await bot.pathfinder.goto(m)
      }
    } catch (e) {
      bot.antiHunger.off()
      throw e
    }

    if (bot.food && (bot.food < 18 || bot.health < 20)) {
      bot.autoEat.eat().catch((err) => {
        console.error('Auto eat had error', err)
      })
    }
  }
}
