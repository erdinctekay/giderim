import { evolu } from "@/evolu-db";

/**
 * Export the Evolu SQLite database as a .db file.
 * Downloads a file named giderim-backup_YYYY-MM-DD_HH-MM-SS.db
 */
export async function exportData(): Promise<void> {
	try {
		const database = await evolu.exportDatabase();

		const blob = new Blob([new Uint8Array(database)], {
			type: "application/x-sqlite3",
		});
		const url = URL.createObjectURL(blob);
		const timestamp = new Date()
			.toISOString()
			.slice(0, 19)
			.replaceAll(":", "-")
			.replaceAll("T", "-");
		const a = document.createElement("a");
		a.href = url;
		a.download = `giderim-backup_${timestamp}.db`;
		a.click();
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Export failed:", error);
	}
}
