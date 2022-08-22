"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
const events_1 = require("events");
const promises_1 = require("timers/promises");
function inject(bot) {
    bot.autoEat = {};
    const foods = require('minecraft-data')(bot.version).foodsByName;
    const foodsNames = Object.keys(foods);
    bot.autoEat.eat = async () => {
        const findFood = () => {
            return bot.inventory.items().find(i => {
                return foodsNames.includes(i.name);
            });
        };
        const food = findFood();
        if (!food) {
            console.warn('No food found!');
            return;
        }
        await retry(equip, food.type);
        try {
            await Promise.race([bot.consume(), timeoutAfter(5000)]);
        }
        catch (err) {
            bot.deactivateItem();
            throw err;
        }
    };
    const equip = async (itemId, destination = 'hand') => {
        bot.updateHeldItem();
        if (bot.heldItem?.type === itemId)
            return;
        const itemInHotbar = bot.inventory.findItemRange(bot.inventory.hotbarStart, bot.inventory.hotbarStart + 9, itemId, null, false, null);
        if (itemInHotbar) {
            setQuickBarSlot(itemInHotbar.slot - bot.inventory.hotbarStart);
            return;
        }
        const itemInInventory = bot.inventory.findInventoryItem(itemId, null, false);
        if (!itemInInventory) {
            throw new Error(`Could not find item ${itemId}`);
        }
        bot._client.writeChannel('MC|PickItem', itemInInventory.slot);
        await Promise.race([(0, events_1.once)(bot, 'heldItemChanged'), (0, promises_1.setTimeout)(2000)]);
        if (bot.heldItem?.type !== itemId) {
            throw new Error('Equipping failed');
        }
    };
    const setQuickBarSlot = (slot) => {
        if (typeof slot !== 'number') {
            throw new Error('Slot must be a number');
        }
        bot.setQuickBarSlot(slot);
    };
}
exports.inject = inject;
async function retry(func, ...param) {
    const maxTries = 3;
    const delay = 200;
    for (let i = 0; i < maxTries; i++) {
        try {
            return await func(...param);
        }
        catch (err) {
            if (i === maxTries - 1) {
                throw err;
            }
            await (0, promises_1.setTimeout)(delay);
        }
    }
}
async function timeoutAfter(timeout = 5000) {
    return (0, promises_1.setTimeout)(timeout).then(() => { throw new Error('timeout'); });
}
//# sourceMappingURL=autoEat.js.map