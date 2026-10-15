export async function register() {
  // Only the long-running production server schedules the weekly broadcast.
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;
  const { startScheduler } = await import('@/server/scheduler');
  startScheduler();
}
