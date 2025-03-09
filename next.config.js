/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !! 仅在生产环境构建时禁用类型检查
        ignoreBuildErrors: true,
    },
    // 确保所有 API 路由都是动态的
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store',
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig 