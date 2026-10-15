import { runScheduledBroadcastIfDue } from '@/server/broadcast';

const CHECK_INTERVAL_MS = 60_000;

export function startScheduler() {
  const tick = () => {
    runScheduledBroadcastIfDue().catch((e: unknown) => {
      console.error(
        JSON.stringify({
          msg: 'scheduler_tick_failed',
          error: e instanceof Error ? e.message.slice(0, 100) : 'unexpected',
        }),
      );
    });
  };
  setInterval(tick, CHECK_INTERVAL_MS).unref();
  tick();
  console.info(JSON.stringify({ msg: 'scheduler_started', schedule: 'Tue 11:00 Europe/Kyiv' }));
}
