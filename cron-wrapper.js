// Wraps the OpenNext worker to add a scheduled cron handler for periodic maintenance.
import original from "./.open-next/worker.js"

export default {
	...original,
	async scheduled(event, env, ctx) {
		// Clean up expired test license keys
		if (env.CORTEX_DB) {
			try {
				const result = await env.CORTEX_DB.prepare(
					"DELETE FROM licenses WHERE expires_at IS NOT NULL AND expires_at < datetime('now')",
				).run()
				console.log(`[cron] Cleaned up ${result.meta.changes} expired license(s)`)
			} catch (e) {
				console.error("[cron] Failed to cleanup expired licenses:", e)
			}
		}
	},
}
