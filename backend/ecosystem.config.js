/**
 * PM2 Ecosystem Configuration
 * Production-ready process management configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env development
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'daily-update-api',

      // Script to execute
      script: './server.js',

      // Number of instances (use 'max' for all CPU cores)
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,

      // Cluster mode for load balancing
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

      // Auto-restart on file changes (dev only)
      watch: false,

      // Ignore specific folders when watching
      ignore_watch: ['node_modules', 'logs', 'uploads', 'tests'],

      // Maximum memory before restart
      max_memory_restart: '1G',

      // Auto-restart on crashes
      autorestart: true,

      // Max restarts within min_uptime (crash loop protection)
      max_restarts: 10,

      // Minimum uptime before considering stable
      min_uptime: '10s',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Log configuration
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Source map support
      source_map_support: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // Advanced options
      cron_restart: '0 3 * * *', // Restart at 3 AM daily (optional)
      vizion: false, // Disable version checking

      // Health check (PM2 Plus)
      instance_var: 'INSTANCE_ID',
    },
  ],

  /**
   * Deployment configuration (optional)
   * For automated deployment with PM2
   */
  deploy: {
    production: {
      // SSH user
      user: 'deploy',

      // SSH host
      host: ['your-server.com'],

      // SSH port
      port: '22',

      // Git remote/branch
      ref: 'origin/main',

      // Git repository
      repo: 'https://github.com/yourusername/daily-update.git',

      // Deployment path on server
      path: '/var/www/daily-update',

      // SSH key path
      key: '~/.ssh/deploy_key',

      // Pre-setup commands
      'pre-setup': 'sudo apt-get update && sudo apt-get install -y git',

      // Post-setup commands
      'post-setup':
        'npm install && pm2 install pm2-logrotate && pm2 set pm2-logrotate:max_size 10M',

      // Pre-deploy commands
      'pre-deploy-local': 'echo "Deploying to production..."',

      // Post-deploy commands
      'post-deploy':
        'cd backend && npm ci --production && pm2 startOrRestart ecosystem.config.js --env production && pm2 save',

      // Environment variables
      env: {
        NODE_ENV: 'production',
      },
    },

    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      port: '22',
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/daily-update.git',
      path: '/var/www/daily-update-staging',
      'post-deploy':
        'cd backend && npm ci && pm2 startOrRestart ecosystem.config.js --env staging && pm2 save',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
