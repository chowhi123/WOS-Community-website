import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'WOS Community',
        short_name: 'WOS Comm',
        description: 'Premier White Out Survival Community',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B101B',
        theme_color: '#0B101B',
        icons: [
            {
                src: "/next.svg",
                sizes: "any",
                type: "image/svg+xml"
            },
            {
                src: "/next.svg",
                sizes: "any",
                type: "image/svg+xml"
            }
        ],
    }
}
