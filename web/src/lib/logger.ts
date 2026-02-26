export enum SecurityEventType {
    AUTH_FAILURE = "AUTH_FAILURE",
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SENSITIVE_ACTION = "SENSITIVE_ACTION"
}

export function logSecurityEvent(type: SecurityEventType, details: Record<string, unknown>) {
    // In production, send this to a dedicated logging service (Datadog, Sentry, CloudWatch)
    // For now, structured console logging.
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({
        level: "SECURITY",
        timestamp,
        type,
        ...details
    }));
}
