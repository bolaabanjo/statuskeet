export interface ServiceConfig {
    /** Unique name for this service within your org */
    name: string;
    /** Service type: http, tcp, dns, or internal */
    type?: "http" | "tcp" | "dns" | "internal";
    /** Description shown on the status page */
    description?: string;
    /** URL to monitor (for http/tcp services) */
    url?: string;
    /** Check interval in seconds (default: 30) */
    checkInterval?: number;
    /** Criticality level (default: standard) */
    criticality?: "critical" | "standard" | "low";
}
export interface StatusKeetOptions {
    /** Your API key (starts with sk_live_) */
    apiKey: string;
    /** Services to register and monitor */
    services: ServiceConfig[];
    /** Heartbeat interval in seconds (default: 30) */
    interval?: number;
    /** API base URL (default: https://api.statuskeet.com) */
    baseUrl?: string;
    /** Called when a heartbeat is sent */
    onHeartbeat?: (result: HeartbeatResult) => void;
    /** Called when an error occurs */
    onError?: (error: Error) => void;
}
export interface HeartbeatResult {
    received: number;
    timestamp: string;
}
export interface ServiceStatus {
    serviceName: string;
    status: "up" | "down" | "degraded";
    responseTimeMs?: number;
    metadata?: Record<string, unknown>;
}
type CheckFn = () => Promise<ServiceStatus> | ServiceStatus;
declare class StatusKeet {
    private apiKey;
    private services;
    private interval;
    private baseUrl;
    private onHeartbeat?;
    private onError?;
    private timer;
    private registered;
    private checks;
    private manualStatuses;
    constructor(options: StatusKeetOptions);
    /**
     * Register a health check function for a service.
     * Called each heartbeat cycle to determine service status.
     */
    check(serviceName: string, fn: CheckFn): this;
    /**
     * Manually report status for a service.
     * Useful for event-driven status updates.
     */
    report(status: ServiceStatus): void;
    /**
     * Start sending heartbeats. Registers services on first call.
     */
    start(): Promise<void>;
    /**
     * Stop sending heartbeats.
     */
    stop(): void;
    /**
     * Send a single heartbeat with current service statuses.
     */
    beat(): Promise<HeartbeatResult>;
    private register;
    private collectStatuses;
}
export default StatusKeet;
export { StatusKeet };
