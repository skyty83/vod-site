import { NextRequest, NextResponse } from 'next/server';
import vm from 'vm';
import axios from 'axios';
import * as CryptoJs from 'crypto-js';
import * as he from 'he';

// We explicitly run on Node.js to use the 'vm' module
export const runtime = 'nodejs';

// Cache downloaded scripts so we don't re-download them on every request
type PluginApi = Record<string, (...args: unknown[]) => unknown>;
const scriptCache: Record<string, PluginApi> = {};

// 只允许执行这一个插件脚本。pluginUrl 来自客户端请求, 若不限制, 任何人都能让服务器下载并执行任意脚本。
// 只开放页面实际用到的方法, 防止调用 constructor 等原型链上的属性
const ALLOWED_ACTIONS = new Set(['search', 'getMediaSource', 'getLyric', 'getTopLists']);

const ALLOWED_PLUGINS = new Set([
    'https://raw.githubusercontent.com/Huibq/keep-alive/master/Music_Free/xiaowo.js',
]);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        const { pluginUrl, action, args } = body;
        
        if (!pluginUrl || !action) {
            return NextResponse.json({ error: 'Missing pluginUrl or action' }, { status: 400 });
        }
        if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
            return NextResponse.json({ error: 'Action not allowed' }, { status: 400 });
        }
        if (args !== undefined && !Array.isArray(args)) {
            return NextResponse.json({ error: 'args must be an array' }, { status: 400 });
        }
        if (!ALLOWED_PLUGINS.has(pluginUrl)) {
            return NextResponse.json({ error: 'Plugin not allowed' }, { status: 403 });
        }
        
        if (!scriptCache[pluginUrl]) {
            const scriptRes = await fetch(pluginUrl);
            const scriptText = await scriptRes.text();
            
            // Setup sandbox environment for the plugin
            const sandbox = {
                require: (moduleName: string) => {
                    if (moduleName === 'axios') return axios;
                    if (moduleName === 'crypto-js') return CryptoJs;
                    if (moduleName === 'he') return he;
                    throw new Error(`Module ${moduleName} not allowed in sandbox`);
                },
                exports: {},
                module: { exports: {} },
                console: console,
                process: { env: {} },
                Buffer: Buffer,
                setTimeout: setTimeout,
                clearTimeout: clearTimeout,
                setInterval: setInterval,
                clearInterval: clearInterval
            };
            
            vm.createContext(sandbox);
            vm.runInContext(scriptText, sandbox, { timeout: 5000 });
            
            // The plugin exposes its API either on exports or module.exports
            scriptCache[pluginUrl] = Object.keys(sandbox.exports).length > 0 ? sandbox.exports : sandbox.module.exports;
        }
        
        const plugin = scriptCache[pluginUrl];
        if (!Object.prototype.hasOwnProperty.call(plugin, action) || typeof plugin[action] !== 'function') {
            return NextResponse.json({ error: `Action ${action} not found in plugin` }, { status: 400 });
        }
        
        // Execute the requested plugin action
        let result: Record<string, unknown> | undefined;
        try {
            result = (await plugin[action](...(args || []))) as Record<string, unknown> | undefined;
        } catch (err) {
            // 很多歌曲本来就没有歌词, 插件会直接抛错。这属于正常情况, 返回空歌词而不是 500
            if (action === 'getLyric') return NextResponse.json({ rawLrc: '' });
            throw err;
        }
        
        if (result === undefined) {
            return NextResponse.json({ error: 'Plugin returned undefined', isEnd: true, data: [] });
        }
        
        // Ensure result is a plain object without circular references or unsupported types
        // 播放地址多为 http, 在 https 站点会被浏览器拦截(混合内容), 统一走本站流式代理
        if (action === 'getMediaSource' && result && typeof result.url === 'string' && /^https?:\/\//.test(result.url)) {
            result.url = `/api/music/stream?u=${encodeURIComponent(result.url)}`;
        }

        const safeResult = JSON.parse(JSON.stringify(result, (key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (typeof value === 'function') return undefined;
            return value;
        }));
        
        return NextResponse.json(safeResult);
        
    } catch (e: unknown) {
        console.error('Plugin execution error:', e);
        return NextResponse.json({ error: e instanceof Error && e.message ? e.message : 'Unknown error' }, { status: 500 });
    }
}
