"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusKeet = void 0;
class StatusKeet {
    apiKey;
    services;
    interval;
    baseUrl;
    onHeartbeat;
    onError;
    timer = null;
    registered = false;
    checks = new Map();
    manualStatuses = new Map();
    constructor(options) {
        if (!options.apiKey)
            throw new Error("StatusKeet: apiKey is required");
        if (!options.services?.length)
            throw new Error("StatusKeet: at least one service is required");
        this.apiKey = options.apiKey;
        this.services = options.services;
        this.interval = (options.interval ?? 30) * 1000;
        this.baseUrl = (options.baseUrl ?? "https://api.statuskeet.com").replace(/\/$/, "");
        this.onHeartbeat = options.onHeartbeat;
        this.onError = options.onError;
    }
    /**
     * Register a health check function for a service.
     * Called each heartbeat cycle to determine service status.
     */
    check(serviceName, fn) {
        this.checks.set(serviceName, fn);
        return this;
    }
    /**
     * Manually report status for a service.
     * Useful for event-driven status updates.
     */
    report(status) {
        this.manualStatuses.set(status.serviceName, status);
    }
    /**
     * Start sending heartbeats. Registers services on first call.
     */
    async start() {
        if (this.timer)
            return;
        if (!this.registered) {
            await this.register();
            this.registered = true;
        }
        // Send first heartbeat immediately
        await this.beat();
        this.timer = setInterval(() => {
            this.beat().catch((err) => {
                this.onError?.(err instanceof Error ? err : new Error(String(err)));
            });
        }, this.interval);
        // Unref so the timer doesn't keep the process alive
        if (this.timer && typeof this.timer === "object" && "unref" in this.timer) {
            this.timer.unref();
        }
    }
    /**
     * Stop sending heartbeats.
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Send a single heartbeat with current service statuses.
     */
    async beat() {
        const statuses = await this.collectStatuses();
        const body = {
            timestamp: new Date().toISOString(),
            sdk_version: "node-0.1.0",
            services: statuses.map((s) => ({
                service_name: s.serviceName,
                status: s.status,
                response_time_ms: s.responseTimeMs,
                metadata: s.metadata,
            })),
        };
        const res = await fetch(`${this.baseUrl}/v1/heartbeat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.apiKey,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`StatusKeet heartbeat failed (${res.status}): ${err}`);
        }
        const data = (await res.json());
        const result = {
            received: data.received,
            timestamp: body.timestamp,
        };
        this.onHeartbeat?.(result);
        return result;
    }
    async register() {
        const body = {
            services: this.services.map((s) => ({
                name: s.name,
                type: s.type ?? "internal",
                description: s.description,
                url: s.url,
                check_interval: s.checkInterval,
                criticality: s.criticality ?? "standard",
            })),
        };
        const res = await fetch(`${this.baseUrl}/v1/services/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.apiKey,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`StatusKeet service registration failed (${res.status}): ${err}`);
        }
    }
    async collectStatuses() {
        const statuses = [];
        for (const service of this.services) {
            // Check for manual status first
            const manual = this.manualStatuses.get(service.name);
            if (manual) {
                statuses.push(manual);
                this.manualStatuses.delete(service.name);
                continue;
            }
            // Run health check if registered
            const checkFn = this.checks.get(service.name);
            if (checkFn) {
                try {
                    const start = Date.now();
                    const result = await checkFn();
                    // If check didn't set responseTimeMs, calculate it
                    if (result.responseTimeMs === undefined) {
                        result.responseTimeMs = Date.now() - start;
                    }
                    statuses.push(result);
                }
                catch (err) {
                    statuses.push({
                        serviceName: service.name,
                        status: "down",
                        metadata: {
                            error: err instanceof Error ? err.message : String(err),
                        },
                    });
                }
                continue;
            }
            // Default: report as up
            statuses.push({
                serviceName: service.name,
                status: "up",
            });
        }
        return statuses;
    }
}
exports.StatusKeet = StatusKeet;
exports.default = StatusKeet;
