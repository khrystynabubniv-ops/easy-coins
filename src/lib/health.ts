export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
}

export type HealthCheck = () => Promise<HealthCheckResult>;

export async function runHealthChecks(checks: HealthCheck[]): Promise<{
  status: HealthStatus;
  checks: HealthCheckResult[];
}> {
  const results = await Promise.all(
    checks.map(async (c) => {
      try {
        return await c();
      } catch (e) {
        return {
          name: 'unknown',
          status: 'down' as const,
          // Keep message short — avoid leaking connection strings or internal hostnames
          message: e instanceof Error ? e.message.slice(0, 100) : 'unexpected error',
        };
      }
    }),
  );
  const status: HealthStatus = results.some((r) => r.status === 'down')
    ? 'down'
    : results.some((r) => r.status === 'degraded')
      ? 'degraded'
      : 'ok';
  return { status, checks: results };
}
