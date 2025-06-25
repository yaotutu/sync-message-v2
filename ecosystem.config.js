module.exports = {
    apps: [
        {
            name: 'sync-message-v2',
            script: 'npm',
            args: 'start',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env_file: '.env',
            env: {
                NODE_ENV: 'development',
                PORT: 4000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 4000
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true
        }
    ]
}; 