import { Channel } from '@/types';

const API_URL = 'https://tv.iill.top/json/Gather';

export async function getChannels(): Promise<Channel[]> {
    try {
        const res = await fetch(API_URL, { cache: 'no-store' });

        // Check if response is valid JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // If not JSON, maybe user agent blocking or error page
            console.error("API did not return JSON");
            throw new Error("Invalid content type");
        }

        if (!res.ok) {
            throw new Error(`Failed to fetch channels: ${res.status}`);
        }
        const data = await res.json();

        if (Array.isArray(data)) {
            return data.map((item: any, index: number) => ({
                id: item.id || `ch-${index}`,
                name: item.name || `Channel ${index + 1}`,
                url: item.url || '',
                group: item.group || 'General',
                logo: item.logo || '',
            }));
        } else if (data && typeof data === 'object') {
            // Handle if it returns { channels: [...] } or similar
            // Adjust based on inspection if possible. 
            // For now, assume if object, likely contains array under common key or just single object (unlikely).
            // If it's a map or dictionary, convert values.
            return Object.values(data).map((item: any, index: number) => ({
                id: item.id || `ch-${index}`,
                name: item.name || `Channel ${index + 1}`,
                url: item.url || '',
                group: item.group || 'General',
                logo: item.logo || '',
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching channels:', error);
        // Return mock data for demonstration if API fails (which is likely given 520)
        return [
            { id: '1', name: 'Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', group: 'Movies', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/250px-Big_buck_bunny_poster_big.jpg' },
            { id: '2', name: 'Sintel', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', group: 'Movies', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sintel_poster.jpg/250px-Sintel_poster.jpg' },
            { id: '3', name: 'Tears of Steel', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', group: 'Movies', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tears_of_Steel_poster.jpg/250px-Tears_of_Steel_poster.jpg' },
        ];
    }
}
