"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const vec3_1 = require("vec3");
const promises_1 = __importDefault(require("fs/promises"));
function inject(bot) {
    bot.afkController = {};
    let intervalTimer = undefined;
    let movementMarkers = [];
    const moves = new mineflayer_pathfinder_1.Movements(bot, require('minecraft-data')(bot.version));
    moves.allow1by1towers = false;
    moves.scafoldingBlocks = [];
    moves.allowSprinting = false;
    moves.canDig = false;
    moves.allowParkour = false;
    bot.afkController.stop = () => {
        bot.antiHunger.off();
        clearInterval(intervalTimer);
        intervalTimer = undefined;
    };
    bot.afkController.start = () => {
        debugger;
        if (intervalTimer)
            return;
        const asyncFunc = async () => {
            try {
                const file = `./config/markers.json`;
                movementMarkers = JSON.parse(await promises_1.default.readFile(file, 'utf8'))
                    .map(({ x, y, z }) => new vec3_1.Vec3(x, y, z));
                if (movementMarkers.length === 0) {
                    console.warn('Marker file does not contain any markers');
                }
            }
            catch (error) {
                console.error('Unable to load markers', error);
            }
        };
        asyncFunc().then(() => {
            intervalTimer = setInterval(() => {
                moveAlongMarkers().catch(console.error);
            }, 2 * 60 * 1000);
            moveAlongMarkers().catch(console.error);
        }).catch(console.error);
    };
    const moveAlongMarkers = async () => {
        bot.antiHunger.on();
        try {
            const markers = movementMarkers.map(pos => new mineflayer_pathfinder_1.goals.GoalBlock(pos.x, pos.y, pos.z));
            for (const m of markers) {
                bot.pathfinder.setMovements(moves);
                await bot.pathfinder.goto(m);
            }
        }
        catch (e) {
            bot.antiHunger.off();
            throw e;
        }
        if (bot.food && (bot.food < 18 || bot.health < 20)) {
            bot.autoEat.eat().catch((err) => {
                console.error('Auto eat had error', err);
            });
        }
    };
}
exports.inject = inject;
//# sourceMappingURL=afk.js.map