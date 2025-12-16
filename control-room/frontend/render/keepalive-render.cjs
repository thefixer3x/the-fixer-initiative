#!/usr/bin/env node

// Keepalive script for Render.com free tier
// Pings the health endpoint to prevent server from sleeping
//
// Usage:
//   node keepalive-render.js
//
// PM2 cron (runs every 10 minutes):
//   pm2 start keepalive-render.js --cron "ASTERISK/10 ASTERISK ASTERISK ASTERISK ASTERISK" --no-autorestart
//   (replace ASTERISK with * in the actual command)

const https = require('https');

const ENDPOINTS = [
  {
    name: 'Render API',
    url: 'https://social-connect-api-74kg.onrender.com/api/health',
    timeout: 120000, // 120s for cold starts
  },
  // Add more endpoints here if needed
  // {
  //   name: 'Another Service',
  //   url: 'https://example.com/health',
  //   timeout: 30000,
  // },
];

function ping(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = https.get(endpoint.url, { timeout: endpoint.timeout }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const status = res.statusCode;
        const isColdStart = duration > 5000; // >5s indicates cold start

        console.log(
          `[${new Date().toISOString()}] ${endpoint.name}: ` +
          `HTTP ${status} | ${(duration / 1000).toFixed(2)}s` +
          (isColdStart ? ' [COLD START]' : ' [WARM]')
        );

        resolve({ name: endpoint.name, status, duration, success: status === 200 });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      console.error(
        `[${new Date().toISOString()}] ${endpoint.name}: TIMEOUT after ${(duration / 1000).toFixed(2)}s`
      );
      reject(new Error(`Timeout after ${duration}ms`));
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.error(
        `[${new Date().toISOString()}] ${endpoint.name}: ERROR - ${err.message} (${(duration / 1000).toFixed(2)}s)`
      );
      reject(err);
    });
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting keepalive pings...`);

  const results = await Promise.allSettled(
    ENDPOINTS.map(endpoint => ping(endpoint))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(
    `[${new Date().toISOString()}] Completed: ${successful} succeeded, ${failed} failed\n`
  );

  // Exit with error code if any pings failed (for monitoring)
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] Fatal error:`, err);
  process.exit(1);
});
