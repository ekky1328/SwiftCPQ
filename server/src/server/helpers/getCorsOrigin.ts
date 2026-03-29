
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const baseDomain = process.env.BASE_DOMAIN;
const isMultiTenant = !!process.env.MULTI_TENANT;

export function getCorsOrigin(): string | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
    if (isMultiTenant && baseDomain) {
        return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin) return callback(null, true);
            try {
                const hostname = new URL(origin).hostname;
                if (hostname === baseDomain || hostname.endsWith(`.${baseDomain}`)) {
                    return callback(null, true);
                }
            } catch {
                return callback(new Error('Invalid origin'));
            }
            if (origin === corsOrigin) return callback(null, true);
            callback(null, false);
        };
    }
    
    return corsOrigin;
}