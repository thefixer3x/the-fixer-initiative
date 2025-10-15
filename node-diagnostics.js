const { exec, spawn } = require('child_process');
const fs = require('fs');

console.log('🔍 VPS Diagnostic Tool - Node.js Version');
console.log('==========================================');

const VPS_IP = '168.231.74.29';
const API_TOKEN = process.env.HOSTINGER_API_TOKEN;

// Test SSH Ports
function testSSHPort(port) {
    return new Promise((resolve) => {
        const ssh = spawn('ssh', [
            '-p', port.toString(),
            '-i', `${process.env.HOME}/.ssh/id_rsa_vps`,
            '-o', 'ConnectTimeout=3',
            '-o', 'BatchMode=yes',
            '-o', 'StrictHostKeyChecking=no',
            `root@${VPS_IP}`,
            'echo SSH_SUCCESS; hostname; uptime'
        ]);

        let output = '';
        ssh.stdout.on('data', (data) => {
            output += data.toString();
        });

        ssh.on('close', (code) => {
            resolve({
                port: port,
                success: code === 0 && output.includes('SSH_SUCCESS'),
                output: output
            });
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            ssh.kill();
            resolve({ port: port, success: false, output: 'Timeout' });
        }, 5000);
    });
}

// Test API Endpoint
function testAPIEndpoint(url) {
    return new Promise((resolve) => {
        const https = require('https');
        const { URL } = require('url');
        
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json',
                'User-Agent': 'VPS-Diagnostic/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    url: url,
                    status: res.statusCode,
                    success: res.statusCode === 200,
                    data: data.substring(0, 200)
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                url: url,
                status: 'ERROR',
                success: false,
                error: error.message
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                url: url,
                status: 'TIMEOUT',
                success: false,
                error: 'Request timeout'
            });
        });

        req.end();
    });
}

async function runDiagnostics() {
    console.log(`Target VPS: ${VPS_IP}`);
    console.log(`API Token: ${API_TOKEN ? 'SET (' + API_TOKEN.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log('');

    // Test SSH Ports
    console.log('🔐 Testing SSH Ports...');
    const sshPorts = [22, 2222, 22000, 2200, 22022];
    
    for (const port of sshPorts) {
        console.log(`Testing SSH port ${port}...`);
        const result = await testSSHPort(port);
        
        if (result.success) {
            console.log(`✅ SSH SUCCESS on port ${port}!`);
            console.log(`Output: ${result.output}`);
            fs.writeFileSync('ssh-working-port.txt', `WORKING_SSH_PORT=${port}\n${result.output}`);
            break;
        } else {
            console.log(`❌ SSH failed on port ${port}`);
        }
    }

    console.log('');
    console.log('🔗 Testing API Endpoints...');
    
    const endpoints = [
        'https://api.hostinger.com/v1',
        'https://api.hostinger.com/v1/vps',
        'https://api.hostinger.com/v1/hosting',
        'https://api.hostinger.com/v1/cloud'
    ];

    const apiResults = [];
    
    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint}`);
        const result = await testAPIEndpoint(endpoint);
        
        console.log(`Status: ${result.status} ${result.success ? '✅' : '❌'}`);
        if (result.error) {
            console.log(`Error: ${result.error}`);
        } else if (result.data) {
            console.log(`Response: ${result.data}...`);
        }
        
        apiResults.push(result);
    }

    // Save results
    const summary = {
        timestamp: new Date().toISOString(),
        vps_ip: VPS_IP,
        api_results: apiResults
    };
    
    fs.writeFileSync('api-test-results.json', JSON.stringify(summary, null, 2));
    
    console.log('');
    console.log('📋 DIAGNOSTIC COMPLETE');
    console.log('Results saved to api-test-results.json');
    
    // Quick ping test
    exec(`ping -c 2 ${VPS_IP}`, (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Ping failed');
        } else {
            console.log('✅ Ping successful');
            console.log(stdout);
        }
    });
}

runDiagnostics().catch(console.error);
