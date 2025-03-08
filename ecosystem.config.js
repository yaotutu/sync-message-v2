module.exports = {
    apps: [
        {
            name: 'sync-message',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 4000,
                NEXT_PUBLIC_BASE_URL: 'https://your-production-domain.com'
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        }
    ]
}; 