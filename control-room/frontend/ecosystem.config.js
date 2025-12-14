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
        NEXT_PUBLIC_SUPABASE_URL: 'https://mxtsdgkwzjzlttpotole.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dHNkZ2t3emp6bHR0cG90b2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDUyNTksImV4cCI6MjA2MjY4MTI1OX0.2KM8JxBEsqQidSvjhuLs8HCX-7g-q6YNswedQ5ZYq3g',
        NEXT_PUBLIC_SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dHNkZ2t3emp6bHR0cG90b2xlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEwNTI1OSwiZXhwIjoyMDYyNjgxMjU5fQ.Aoob84MEgNV-viFugZHWKodJUjn4JOQNzcSQ57stJFU',
        NEXT_PUBLIC_BASE_URL: 'https://control-room.connectionpoint.tech',
        NEXT_PUBLIC_USE_MOCK_AUTH: 'false',
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
