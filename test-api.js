// Test script to verify the multi-source API
const STOREHOUSE_URL = 'https://fastly.jsdelivr.net/gh/tv189ymail/ku2023@main/A1/ck.json';

async function testAPI() {
    console.log('Testing Multi-Source VOD API...\n');

    try {
        // Step 1: Fetch storeHouse
        console.log('1. Fetching storeHouse from:', STOREHOUSE_URL);
        const res = await fetch(STOREHOUSE_URL);
        const data = await res.json();

        console.log(`   ✓ Found ${data.storeHouse.length} sources\n`);

        // Step 2: Try to fetch first valid source config
        console.log('2. Fetching source configurations...');
        let successCount = 0;
        let totalSources = 0;

        for (let i = 0; i < Math.min(data.storeHouse.length, 5); i++) {
            const source = data.storeHouse[i];

            if (source.sourceUrl.startsWith('clan://')) {
                console.log(`   ⊘ Skipping local source: ${source.sourceName}`);
                continue;
            }

            try {
                console.log(`   → Fetching: ${source.sourceName}`);
                const sourceRes = await fetch(source.sourceUrl, {
                    signal: AbortSignal.timeout(5000)
                });

                if (!sourceRes.ok) {
                    console.log(`   ✗ Failed (${sourceRes.status})`);
                    continue;
                }

                const sourceConfig = await sourceRes.json();

                if (sourceConfig.sites && Array.isArray(sourceConfig.sites)) {
                    const apiSites = sourceConfig.sites.filter(site => site.api && site.type === 1);
                    totalSources += apiSites.length;
                    successCount++;
                    console.log(`   ✓ Found ${apiSites.length} API sources`);

                    // Show first 3 API sources
                    apiSites.slice(0, 3).forEach(site => {
                        console.log(`     - ${site.name}: ${site.api}`);
                    });
                }
            } catch (e) {
                console.log(`   ✗ Error: ${e.message}`);
            }
        }

        console.log(`\n3. Summary:`);
        console.log(`   ✓ Successfully loaded ${successCount} source configs`);
        console.log(`   ✓ Total API sources available: ${totalSources}`);

        if (totalSources > 0) {
            console.log('\n✅ API is working correctly!');
        } else {
            console.log('\n⚠️  No valid API sources found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI();
