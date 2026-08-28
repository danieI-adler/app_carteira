/**
 * Client-side price sync is disabled in favor of the centralized 19:00 BRT daily robot.
 */
export async function autoUpdatePricesClientSide() {
  // Centralized price synchronization runs via GitHub Actions daily at 19:00 BRT
  return
}
