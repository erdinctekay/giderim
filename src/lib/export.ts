import { evolu } from '@/evolu-db'
import { cast } from '@evolu/react'

/**
 * Helper to extract rows from a result, handling all possible formats
 */
const getRows = (result: unknown): unknown[] => {
	if (Array.isArray(result)) return result
	if (result && typeof result === 'object' && 'rows' in result) {
		return (result as { rows: unknown[] }).rows
	}
	return []
}

/**
 * Export all application data to a JSON backup file.
 * Downloads a file named giderim-backup_YYYY-MM-DD_HH-MM-SS.json
 *
 * TODO: think more proper solutions
 *
 */
export async function exportData(): Promise<void> {
	try {
		// Create queries for all tables
		const entriesQuery = evolu.createQuery((db) =>
			db.selectFrom('entry').selectAll().where('isDeleted', 'is not', cast(true)),
		)
		const groupsQuery = evolu.createQuery((db) =>
			db.selectFrom('entryGroup').selectAll().where('isDeleted', 'is not', cast(true)),
		)
		const tagsQuery = evolu.createQuery((db) =>
			db.selectFrom('entryTag').selectAll().where('isDeleted', 'is not', cast(true)),
		)
		const recurringConfigsQuery = evolu.createQuery((db) =>
			db.selectFrom('recurringConfig').selectAll().where('isDeleted', 'is not', cast(true)),
		)
		const exclusionsQuery = evolu.createQuery((db) =>
			db.selectFrom('exclusion').selectAll().where('isDeleted', 'is not', cast(true)),
		)

		// Load all queries
		const rawResults = await evolu.loadQueries([
			entriesQuery,
			groupsQuery,
			tagsQuery,
			recurringConfigsQuery,
			exclusionsQuery,
		])

		// Normalize results: handle array of promises or direct results
		const results =
			Array.isArray(rawResults) && rawResults[0] instanceof Promise ? await Promise.all(rawResults) : rawResults

		// Extract data based on result structure
		const data = {
			exportDate: new Date().toISOString(),
			version: 'gider.im backup',
			entries: getRows(Array.isArray(results) ? results[0] : results),
			groups: getRows(Array.isArray(results) ? results[1] : results),
			tags: getRows(Array.isArray(results) ? results[2] : results),
			recurringConfigs: getRows(Array.isArray(results) ? results[3] : results),
			exclusions: getRows(Array.isArray(results) ? results[4] : results),
		}

		console.log('Exported data:', data)

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
		const a = document.createElement('a')
		a.href = url
		a.download = `giderim-backup_${timestamp}.json`
		a.click()
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Export failed:', error)
		alert('Export failed. Check console for details.')
	}
}
