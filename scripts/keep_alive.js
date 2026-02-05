const https = require('https');

// Use Render's environment variable if available, or a custom one, or a placeholder
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://ai-counsellor-backend-wjlf.onrender.com';

function keepAlive() {
    if (RENDER_URL === 'https://your-app-name.onrender.com') {
        console.warn('⚠️  Warning: RENDER_EXTERNAL_URL is not set. Using placeholder URL.');
    }

    console.log(`Pinging ${RENDER_URL}...`);

    https.get(RENDER_URL, (res) => {
        if (res.statusCode === 200) {
            console.log(`✅ Server pinged successfully: ${res.statusCode}`);
        } else {
            console.log(`⚠️  Server responded with status: ${res.statusCode}`);
        }
    }).on('error', (err) => {
        console.error(`❌ Ping failed: ${err.message}`);
    });
}

// Ping immediately on start
keepAlive();

// Ping every 14 minutes (14 * 60 * 1000) to stay within the 15-minute window
const INTERVAL = 14 * 60 * 1000;
setInterval(keepAlive, INTERVAL);
