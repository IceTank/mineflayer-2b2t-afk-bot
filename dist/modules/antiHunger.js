"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
function inject(conn) {
    conn.bot.antiHunger = {};
    const bot = conn.bot;
    conn.optimizePacketWrite = false;
    const editIfPosition = (name, data) => {
        // console.info(`[AntiHunger] Writing ${name}`)
        if (name === 'position' || name === 'position_look') {
            if ((bot.proxy.botHasControl() || bot.antiHunger.allPackets) && bot.antiHunger.active) {
                if (!bot.targetDigBlock) {
                    data.onGround = false;
                    // console.info('Anti hunger intercepting position packets')
                }
            }
        }
    };
    const originalWriteIf = conn.writeIf.bind(conn);
    const originalWrite = conn.write.bind(conn);
    const originalBotWrite = bot._client.write.bind(bot._client);
    const writeIf = (name, data) => {
        editIfPosition(name, data);
        originalWriteIf(name, data);
    };
    const write = (name, data) => {
        editIfPosition(name, data);
        originalWrite(name, data);
    };
    const botWriteIf = (name, data) => {
        editIfPosition(name, data);
        originalBotWrite(name, data);
    };
    conn.writeIf = writeIf.bind(conn);
    conn.write = write.bind(conn);
    bot._client.write = botWriteIf.bind(bot._client);
    bot.antiHunger.allPackets = true;
    bot.antiHunger.active = true;
    bot.antiHunger.on = () => {
        bot.antiHunger.active = true;
    };
    bot.antiHunger.off = () => {
        bot.antiHunger.active = false;
    };
}
exports.inject = inject;
//# sourceMappingURL=antiHunger.js.map