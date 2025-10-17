#!/usr/bin/env node

// API Endpoint Investigator for Hostinger
const https = require('https');
const { URL } = require('url');

const API_TOKEN = process.env.HOSTINGER_API_TOKEN;

// Different API endpoints to test
const endpoints = [
    'https://api.hostinger.com/v1',
    'https://api.hostinger.com/v1/vps',
    'https://api.hostinger.com/v1/hosting', 
    'https://api.hostinger.com/v1/cloud',
    'https://api.hostinger.com/v1/servers',
    'https://rest-api.hostinger.com/v2',
    'https://rest-api.hostinger.com/v2/vps',
    'https://hpanel-api.hostinger.com/v1',
    'https://api.hostinger.com/v2/vps'
];

async function testEndpoint(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json',
                'User-Agent': 'VPS-Diagnostic-Tool/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    url: url,
                    status: res.statusCode,
                    headers: res.headers,
                    data: data.length > 200 ? data.substring(0, 200) + '...' : data
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                url: url,
                status: 'ERROR',
                error: error.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url: url,
                status: 'TIMEOUT',
                error: 'Request timeout'
            });
        });

        req.end();
    });
}

async function main() {
    console.log('🔍 Hostinger API Endpoint Investigation');
    console.log('=======================================');
    console.log(`Using API Token: ${API_TOKEN ? API_TOKEN.substring(0, 10) + '...' : 'NOT SET'}`);
    console.log('');

    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint}`);
        const result = await testEndpoint(endpoint);
        
        console.log(`Status: ${result.status}`);
        if (result.error) {
            console.log(`Error: ${result.error}`);
        } else if (result.data) {
            console.log(`Response: ${result.data}`);
        }
        console.log('---');
    }
}

main().catch(console.error);
