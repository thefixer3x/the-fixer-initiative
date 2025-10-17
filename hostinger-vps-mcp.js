#!/usr/bin/env node

/**
 * Hostinger VPS Management MCP Server
 * Provides diagnostic and management capabilities for Hostinger VPS instances
 */

const { spawn } = require('child_process');
const https = require('https');
const net = require('net');

class HostingerVPSMCP {
    constructor() {
        this.apiToken = process.env.HOSTINGER_API_TOKEN;
        this.endpoints = {
            primary: 'https://api.hostinger.com/v1',
            backup: 'https://rest-api.hostinger.com/v2',
            fallback: 'https://api.hostinger.com'
        };
    }

    // Tool: diagnose_vps
    async diagnoseVPS(params) {
        const { vps_ip, include_network = true, include_ssh = true, include_api = true } = params;
        
        const results = {
            timestamp: new Date().toISOString(),
            vps_ip: vps_ip,
            diagnostics: {}
        };

        try {
            if (include_network) {
                results.diagnostics.network = await this.networkDiagnostics(vps_ip);
            }

            if (include_ssh) {
                results.diagnostics.ssh = await this.sshDiagnostics(vps_ip);
            }

            if (include_api) {
                results.diagnostics.api = await this.apiDiagnostics();
            }

            return {
                status: 'success',
                data: results
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                data: results
            };
        }
    }

    // Tool: check_vps_status
    async checkVPSStatus(params) {
        const { server_id } = params;
        
        for (const [name, endpoint] of Object.entries(this.endpoints)) {
            try {
                const result = await this.makeAPICall(`${endpoint}/vps/${server_id}`, 'GET');
                return {
                    status: 'success',
                    endpoint_used: name,
                    data: result
                };
            } catch (error) {
                console.log(`${name} endpoint failed: ${error.message}`);
                continue;
            }
        }

        return {
            status: 'error',
            message: 'All API endpoints failed',
            server_id: server_id
        };
    }

    // Tool: restart_vps_services
    async restartVPSServices(params) {
        const { server_id, service } = params;
        
        const endpoint = `${this.endpoints.primary}/vps/${server_id}/services/${service}/restart`;
        
        try {
            const result = await this.makeAPICall(endpoint, 'POST');
            return {
                status: 'success',
                message: `Service ${service} restart initiated`,
                data: result
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to restart ${service}: ${error.message}`,
                server_id: server_id,
                service: service
            };
        }
    }

    // Helper Methods
    async networkDiagnostics(ip) {
        return new Promise((resolve) => {
            const ping = spawn('ping', ['-c', '3', ip]);
            let output = '';
            
            ping.stdout.on('data', (data) => {
                output += data.toString();
            });

            ping.on('close', (code) => {
                const isReachable = code === 0;
                const avgTime = output.match(/avg = ([\d.]+)/);
                
                resolve({
                    reachable: isReachable,
                    average_ping: avgTime ? parseFloat(avgTime[1]) : null,
                    packet_loss: output.includes('100% packet loss'),
                    raw_output: output
                });
            });
        });
    }

    async sshDiagnostics(ip) {
        const ports = [22, 2222, 22000, 2200];
        const results = {};

        for (const port of ports) {
            results[`port_${port}`] = await this.checkPort(ip, port);
        }

        return results;
    }

    async checkPort(ip, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 3000;

            socket.setTimeout(timeout);
            socket.on('connect', () => {
                socket.destroy();
                resolve({ open: true, port: port });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ open: false, port: port, reason: 'timeout' });
            });

            socket.on('error', (err) => {
                resolve({ open: false, port: port, reason: err.code });
            });

            socket.connect(port, ip);
        });
    }

    async apiDiagnostics() {
        const results = {};
        
        for (const [name, endpoint] of Object.entries(this.endpoints)) {
            try {
                const start = Date.now();
                await this.makeAPICall(`${endpoint}/health`, 'GET');
                const duration = Date.now() - start;
                
                results[name] = {
                    status: 'success',
                    response_time: duration,
                    endpoint: endpoint
                };
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message,
                    endpoint: endpoint
                };
            }
        }

        return results;
    }

    async makeAPICall(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Accept': 'application/json',
                    'User-Agent': 'Hostinger-VPS-MCP/1.0'
                }
            };

            if (data) {
                options.headers['Content-Type'] = 'application/json';
            }

            const req = https.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (e) {
                        resolve({ raw_response: responseData, status_code: res.statusCode });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }
}

// MCP Server Implementation
const mcp = new HostingerVPSMCP();

// Handle MCP protocol messages
process.stdin.on('data', async (data) => {
    try {
        const message = JSON.parse(data.toString());
        let response;

        switch (message.method) {
            case 'tools/list':
                response = {
                    tools: [
                        {
                            name: 'diagnose_vps',
                            description: 'Comprehensive VPS health check and diagnostics'
                        },
                        {
                            name: 'check_vps_status',
                            description: 'Quick VPS status check via API'
                        },
                        {
                            name: 'restart_vps_services',
                            description: 'Restart VPS services via API'
                        }
                    ]
                };
                break;

            case 'tools/call':
                const { name, arguments: args } = message.params;
                
                switch (name) {
                    case 'diagnose_vps':
                        response = await mcp.diagnoseVPS(args);
                        break;
                    case 'check_vps_status':
                        response = await mcp.checkVPSStatus(args);
                        break;
                    case 'restart_vps_services':
                        response = await mcp.restartVPSServices(args);
                        break;
                    default:
                        response = { error: 'Unknown tool' };
                }
                break;

            default:
                response = { error: 'Unknown method' };
        }

        console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: response
        }));

    } catch (error) {
        console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -1,
                message: error.message
            }
        }));
    }
});

// If run directly, perform diagnostics
if (require.main === module) {
    (async () => {
        console.log('🔍 Hostinger VPS Diagnostic Tool');
        console.log('=================================');
        
        const vpsIP = '168.231.74.29';
        const result = await mcp.diagnoseVPS({
            vps_ip: vpsIP,
            include_network: true,
            include_ssh: true,
            include_api: true
        });
        
        console.log(JSON.stringify(result, null, 2));
    })();
}
