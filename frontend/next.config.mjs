/** @type {import('next').NextConfig} */

const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4000/api/:path*',
            },
        ];
    },
    async redirects() {
        return [
            {
                source: "/auth/login",
                has: [
                    {
                        type: "cookie",
                        key: "connect.sid",
                    },
                    {
                        type: "cookie",
                        key: "jwt",
                    }
                ],
                permanent: false,
                destination: "/",
            },
            {
                source: "/:path((?!auth).*)",
                missing: [
                    {
                        type: "cookie",
                        key: "connect.sid",
                    },
                    {
                        type: "cookie",
                        key: "jwt",
                    }
                ],
                permanent: false,
                destination: "/auth/login",
                has: [
                    {
                        type: 'header',
                        key: 'accept',
                        value: 'text/html',
                    }
                ],
            },

        ];
    },
};

export default nextConfig;
