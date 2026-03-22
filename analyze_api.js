
const url = 'https://ghproxy.net/raw.githubusercontent.com/PizazzGY/TV/master/output/user_result.txt';

(async () => {
    try {
        console.log('Fetching:', url);
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Fetch failed:', res.status, res.statusText);
            return;
        }
        const text = await res.text();
        console.log('Content preview:');
        console.log(text.substring(0, 500));
    } catch (e) {
        console.error('Error:', e);
    }
})();
