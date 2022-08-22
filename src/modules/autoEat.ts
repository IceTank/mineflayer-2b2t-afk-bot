import { Bot } from "mineflayer"
import type { Item } from 'prismarine-item'
import { once } from 'events'
import { setTimeout } from 'timers/promises'

interface AutoEat {
  eat(): Promise<void>
}

declare module 'mineflayer' {
  interface Bot {
    autoEat: AutoEat
  }
}

export function inject(bot: Bot) {
  bot.autoEat = {} as AutoEat

  const foods = require('minecraft-data')(bot.version).foodsByName
  const foodsNames = Object.keys(foods)

  bot.autoEat.eat = async () => {
    const findFood = (): Item | undefined => {
      return bot.inventory.items().find(i => {
        return foodsNames.includes(i.name)
      })
    }

    const food = findFood()

    if (!food) {
      console.warn('No food found!')
      return
    }
    await retry(equip, food.type)
    try {
      await Promise.race([bot.consume(), timeoutAfter(5000)])
    } catch (err: any) {
      bot.deactivateItem()
      throw err
    }
  }

  const equip = async (itemId: number, destination: 'hand' | 'off-hand' = 'hand') => {
    bot.updateHeldItem()
    if (bot.heldItem?.type === itemId) return
    const itemInHotbar = bot.inventory.findItemRange(bot.inventory.hotbarStart, bot.inventory.hotbarStart + 9, itemId, null, false, null)
    if (itemInHotbar) {
      setQuickBarSlot(itemInHotbar.slot - bot.inventory.hotbarStart)
      return
    }

    const itemInInventory = bot.inventory.findInventoryItem(itemId, null, false)

    if (!itemInInventory) {
      throw new Error(`Could not find item ${itemId}`)
    }

    bot._client.writeChannel('MC|PickItem', itemInInventory.slot)

    await Promise.race([once(bot, 'heldItemChanged'), setTimeout(2000)])
    if (bot.heldItem?.type !== itemId) {
      throw new Error('Equipping failed')
    }
  }

  const setQuickBarSlot = (slot: number) => {
    if (typeof slot !== 'number') {
      throw new Error('Slot must be a number')
    }
    bot.setQuickBarSlot(slot)
  }
}

async function retry(func: (...params: any) => Promise<any>, ...param: any) {
  const maxTries = 3
  const delay = 200
  for (let i = 0; i < maxTries; i++) {
    try {
      return await func(...param)
    } catch (err) {
      if (i === maxTries - 1) {
        throw err
      }
      await setTimeout(delay)
    }
  }
}

async function timeoutAfter(timeout: number = 5000): Promise<never> {
  return setTimeout(timeout).then(() => {throw new Error('timeout')})
}
