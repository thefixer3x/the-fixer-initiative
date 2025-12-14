module.exports = {
  apps: [
    {
      name: 'control-room-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/opt/lanonasis/the-fixer-initiative/control-room/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '7779',
      },
      env_file: '.env.production',
      error_file: '/var/log/pm2/control-room-frontend-error.log',
      out_file: '/var/log/pm2/control-room-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      combine_logs: true,
      min_uptime: '30s',
      max_restarts: 5,
      restart_delay: 10000,
      listen_timeout: 10000,
      kill_timeout: 10000,
      wait_ready: false,
      ignore_watch: ['node_modules', '*.log', '.git', '.next'],
      node_args: '--max-old-space-size=1024',
    }
  ]
};
