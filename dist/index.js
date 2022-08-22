"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mineflayer_pathfinder_1 = require("mineflayer-pathfinder");
const mineflayer_proxy_inspector_1 = require("mineflayer-proxy-inspector");
const antiHunger_1 = require("./modules/antiHunger");
const autoEat_1 = require("./modules/autoEat");
const afk_1 = require("./modules/afk");
const fs_1 = require("fs");
let allowList = [];
try {
    allowList = (0, fs_1.readFileSync)('./config/allowList.txt', 'utf8').split('\n');
}
catch (err) {
    console.error('Reading allowlist failed');
}
function loadPlugins(conn) {
    (0, antiHunger_1.inject)(conn);
    conn.bot.loadPlugins([
        mineflayer_pathfinder_1.pathfinder, afk_1.inject, autoEat_1.inject
    ]);
}
let proxy;
proxy = new mineflayer_proxy_inspector_1.InspectorProxy({
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
});
proxy.on('botReady', (conn) => {
    loadPlugins(conn);
    const bot = conn.bot;
    bot.proxy.emitter.on('proxyBotLostControl', () => {
        bot.antiHunger.off();
    });
    setTimeout(() => {
        console.info('Starting anti afk');
        bot.afkController.start();
    }, 3000);
    bot.on('error', (err) => console.error('Bot error', err));
    bot.on('kicked', console.error);
    bot.on('spawn', () => console.info('Bot spawned'));
    bot.on('end', () => proxy?.stopBot());
});
proxy.on('clientConnect', async () => {
    if (!proxy) {
        console.info('Client connected but proxy not ready');
        return;
    }
});
process.once('SIGINT', () => {
    proxy?.stopBot();
    proxy?.stopServer();
    process.kill(process.pid, 'SIGINT');
});
//# sourceMappingURL=index.js.map