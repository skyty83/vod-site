import { NextRequest, NextResponse } from 'next/server';
import vm from 'vm';
import axios from 'axios';
import * as CryptoJs from 'crypto-js';
import * as he from 'he';

// We explicitly run on Node.js to use the 'vm' module
export const runtime = 'nodejs';

// Cache downloaded scripts so we don't re-download them on every request
const scriptCache: Record<string, any> = {};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pluginUrl, action, args } = body;
        
        if (!pluginUrl || !action) {
            return NextResponse.json({ error: 'Missing pluginUrl or action' }, { status: 400 });
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
                process: process,
                Buffer: Buffer,
                setTimeout: setTimeout,
                clearTimeout: clearTimeout,
                setInterval: setInterval,
                clearInterval: clearInterval
            };
            
            vm.createContext(sandbox);
            vm.runInContext(scriptText, sandbox);
            
            // The plugin exposes its API either on exports or module.exports
            scriptCache[pluginUrl] = Object.keys(sandbox.exports).length > 0 ? sandbox.exports : sandbox.module.exports;
        }
        
        const plugin = scriptCache[pluginUrl];
        if (typeof plugin[action] !== 'function') {
            return NextResponse.json({ error: `Action ${action} not found in plugin` }, { status: 400 });
        }
        
        // Execute the requested plugin action
        const result = await plugin[action](...(args || []));
        
        if (result === undefined) {
            return NextResponse.json({ error: 'Plugin returned undefined', isEnd: true, data: [] });
        }
        
        // Ensure result is a plain object without circular references or unsupported types
        const safeResult = JSON.parse(JSON.stringify(result, (key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (typeof value === 'function') return undefined;
            return value;
        }));
        
        return NextResponse.json(safeResult);
        
    } catch (e: any) {
        console.error('Plugin execution error:', e);
        return NextResponse.json({ error: e.message ? String(e.message) : 'Unknown error' }, { status: 500 });
    }
}
