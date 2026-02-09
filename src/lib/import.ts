const IMPORT_DB_NAME = "giderim-pending-import";
const IMPORT_STORE_NAME = "pending-db";
const IMPORT_FLAG_KEY = "giderim-pending-db-import";

const HEADER_MAX_PATH_SIZE = 512;
const HEADER_OFFSET_DATA = 4096;

const EVOLU_DB_PATH = "/evolu1.db";
const OPFS_VFS_DIR = ".Evolu";
const OPAQUE_DIR_NAME = ".opaque";

/** The SAH Pool default capacity — must match sqlite-wasm's initialCapacity. */
const SAH_POOL_INITIAL_CAPACITY = 6;

/**
 * Open (or create) the IndexedDB used for staging import files.
 */
function openImportDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(IMPORT_DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(IMPORT_STORE_NAME)) {
				db.createObjectStore(IMPORT_STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(
				new Error(
					request.error?.message ?? "Failed to open IndexedDB",
				),
			);
	});
}

/**
 * Store a database file's bytes in IndexedDB for post-reload processing.
 */
async function storeImportBytes(bytes: Uint8Array): Promise<void> {
	const db = await openImportDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IMPORT_STORE_NAME, "readwrite");
		const store = tx.objectStore(IMPORT_STORE_NAME);
		store.put(bytes, "dbBytes");
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(
				new Error(
					tx.error?.message ?? "Failed to store import data",
				),
			);
		};
	});
}

/**
 * Read the staged import bytes from IndexedDB.
 */
async function readImportBytes(): Promise<Uint8Array | null> {
	const db = await openImportDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IMPORT_STORE_NAME, "readonly");
		const store = tx.objectStore(IMPORT_STORE_NAME);
		const request = store.get("dbBytes");
		request.onsuccess = () => {
			db.close();
			resolve(request.result ?? null);
		};
		request.onerror = () => {
			db.close();
			reject(
				new Error(
					request.error?.message ?? "Failed to read import data",
				),
			);
		};
	});
}

/**
 * Clear the staged import data from IndexedDB.
 */
async function clearImportDB(): Promise<void> {
	const db = await openImportDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(IMPORT_STORE_NAME, "readwrite");
		const store = tx.objectStore(IMPORT_STORE_NAME);
		store.clear();
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(
				new Error(
					tx.error?.message ?? "Failed to clear import data",
				),
			);
		};
	});
}

/**
 * Debug: dump the current OPFS state to console.
 */
export async function debugOPFS(): Promise<void> {
	try {
		const root = await navigator.storage.getDirectory();
		console.log("[debugOPFS] OPFS root obtained");

		let vfsDir: FileSystemDirectoryHandle;
		try {
			vfsDir = await root.getDirectoryHandle(OPFS_VFS_DIR);
		} catch {
			console.log(`[debugOPFS] No "${OPFS_VFS_DIR}" directory found`);
			return;
		}

		let opaqueDir: FileSystemDirectoryHandle;
		try {
			opaqueDir = await vfsDir.getDirectoryHandle(OPAQUE_DIR_NAME);
		} catch {
			console.log(
				`[debugOPFS] No "${OPAQUE_DIR_NAME}" directory found inside "${OPFS_VFS_DIR}"`,
			);
			return;
		}

		const files: { name: string; size: number; path: string }[] = [];
		for await (const [name, handle] of opaqueDir as unknown as AsyncIterable<
			[string, FileSystemHandle]
		>) {
			if (handle.kind !== "file") continue;
			const fileHandle = handle as FileSystemFileHandle;
			const file = await fileHandle.getFile();
			let path = "(unreadable)";
			if (file.size >= HEADER_MAX_PATH_SIZE) {
				const headerBytes = new Uint8Array(
					await file.slice(0, HEADER_MAX_PATH_SIZE).arrayBuffer(),
				);
				const pathEnd = headerBytes.indexOf(0);
				path = new TextDecoder().decode(
					headerBytes.slice(0, Math.max(pathEnd, 0)),
				);
				if (!path) path = "(empty)";
			}
			files.push({ name, size: file.size, path });
		}

		console.log(`[debugOPFS] Found ${files.length} pool files:`);
		for (const f of files) {
			const dataSize = Math.max(f.size - HEADER_OFFSET_DATA, 0);
			console.log(
				`[debugOPFS]   "${f.name}" → path="${f.path}", total=${f.size}B, data=${dataSize}B`,
			);
		}
	} catch (err) {
		console.error("[debugOPFS] Error:", err);
	}
}

/**
 * Validate that a Uint8Array looks like a SQLite database.
 * Checks for the "SQLite format 3\0" magic header (16 bytes).
 */
function isValidSQLite(bytes: Uint8Array): boolean {
	if (bytes.length < 100) return false;
	const magic = new TextDecoder().decode(bytes.slice(0, 15));
	return magic === "SQLite format 3";
}

/**
 * Extract clean SQLite bytes from either:
 * - A raw SQLite file (exported via evolu.exportDatabase())
 * - An OPFS SAH Pool file (with 4096-byte header, downloaded via Chrome DevTools)
 */
function extractSQLiteBytes(rawBytes: Uint8Array): Uint8Array | null {
	if (isValidSQLite(rawBytes)) {
		return rawBytes;
	}

	if (rawBytes.length > HEADER_OFFSET_DATA) {
		const afterHeader = rawBytes.slice(HEADER_OFFSET_DATA);
		if (isValidSQLite(afterHeader)) {
			return afterHeader;
		}
	}

	return null;
}

/**
 * Phase 1: User triggers import.
 * Reads the selected file, validates it, stores in IndexedDB, and reloads.
 */
export async function importDatabase(file: File): Promise<void> {
	console.log(
		`[import:phase1] File selected: "${file.name}", size=${file.size}B, type="${file.type}"`,
	);

	const buffer = await file.arrayBuffer();
	const rawBytes = new Uint8Array(buffer);

	console.log(
		`[import:phase1] Raw bytes read: ${rawBytes.length}B, first16=`,
		Array.from(rawBytes.slice(0, 16)),
	);

	const sqliteBytes = extractSQLiteBytes(rawBytes);
	if (!sqliteBytes) {
		console.error(
			"[import:phase1] File is not a valid SQLite database (no magic header found)",
		);
		throw new Error("Invalid database file. Expected a SQLite database.");
	}

	console.log(
		`[import:phase1] Valid SQLite extracted: ${sqliteBytes.length}B`,
	);

	await storeImportBytes(sqliteBytes);
	console.log("[import:phase1] Stored in IndexedDB successfully");

	// Verify the store
	const verifyBytes = await readImportBytes();
	const verifyMsg = verifyBytes ? `${verifyBytes.length}B` : "NULL";
	console.log(`[import:phase1] Verify IndexedDB read: ${verifyMsg}`);

	localStorage.setItem(IMPORT_FLAG_KEY, "true");
	console.log(
		`[import:phase1] Flag set: "${localStorage.getItem(IMPORT_FLAG_KEY)}"`,
	);
	console.log("[import:phase1] Reloading page...");
	globalThis.location.reload();
}

/**
 * Phase 2: Called on page load BEFORE createEvolu().
 * Checks for a pending import, writes the database to OPFS, and cleans up.
 */
export async function processPendingImport(): Promise<boolean> {
	const flagValue = localStorage.getItem(IMPORT_FLAG_KEY);
	console.log(`[import:phase2] Flag check: "${flagValue}"`);

	if (flagValue !== "true") {
		return false;
	}

	console.log("[import:phase2] === PENDING IMPORT DETECTED ===");

	try {
		console.log("[import:phase2] Reading from IndexedDB...");
		const sqliteBytes = await readImportBytes();
		if (!sqliteBytes) {
			console.error(
				"[import:phase2] Flag set but no data found in IndexedDB!",
			);
			localStorage.removeItem(IMPORT_FLAG_KEY);
			return false;
		}

		console.log(
			`[import:phase2] Read ${sqliteBytes.length}B from IndexedDB`,
		);
		console.log(
			`[import:phase2] SQLite magic check: "${new TextDecoder().decode(sqliteBytes.slice(0, 15))}"`,
		);

		console.log("[import:phase2] Writing to OPFS via Worker...");
		await writeToOPFSviaWorker(sqliteBytes);
		console.log("[import:phase2] OPFS write complete");

		console.log("[import:phase2] Clearing IndexedDB...");
		await clearImportDB();

		localStorage.removeItem(IMPORT_FLAG_KEY);
		console.log(
			"[import:phase2] === IMPORT COMPLETED SUCCESSFULLY ===",
		);
		return true;
	} catch (error) {
		console.error("[import:phase2] === IMPORT FAILED ===", error);
		localStorage.removeItem(IMPORT_FLAG_KEY);
		await clearImportDB();
		return false;
	}
}

/**
 * The inline Worker code that writes to OPFS using createSyncAccessHandle().
 *
 * This MUST run in a Worker because createSyncAccessHandle() is only available
 * in Web Workers. Using the same API that sqlite-wasm's opfs-sahpool VFS uses
 * guarantees that the written files are readable by the VFS.
 *
 * The Worker receives { sqliteBytes, config } and:
 * 1. Deletes the existing .Evolu directory
 * 2. Creates .Evolu/.opaque/ with 6 pool files
 * 3. The first pool file has the imported SQLite data mapped to /evolu1.db
 * 4. The remaining 5 are empty placeholder slots for journal/WAL/temp
 *
 * File header format (matches sqlite-wasm OpfsSAHPool exactly):
 *   Bytes 0..511:   UTF-8 encoded virtual path, zero-padded
 *   Bytes 512..515: Flags (Uint32, big-endian via DataView default)
 *   Bytes 516..523: Digest (2x Uint32)
 *   Bytes 524..4095: Unused (zeros)
 *   Bytes 4096+:    SQLite database content
 */
function getWorkerCode(): string {
	return `
"use strict";

const HEADER_MAX_PATH_SIZE = 512;
const HEADER_FLAGS_SIZE = 4;
const HEADER_CORPUS_SIZE = HEADER_MAX_PATH_SIZE + HEADER_FLAGS_SIZE;
const HEADER_OFFSET_FLAGS = HEADER_MAX_PATH_SIZE;
const HEADER_OFFSET_DIGEST = HEADER_CORPUS_SIZE;
const HEADER_OFFSET_DATA = 4096;
const SQLITE_OPEN_MAIN_DB = 0x00000100;

function computeDigest(byteArray) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (const v of byteArray) {
    h1 = 31 * h1 + v * 307;
    h2 = 31 * h2 + v * 307;
  }
  return new Uint32Array([h1 >>> 0, h2 >>> 0]);
}

function setAssociatedPath(sah, path, flags) {
  const apBody = new Uint8Array(HEADER_CORPUS_SIZE);
  const dvBody = new DataView(apBody.buffer);

  const enc = new TextEncoder().encodeInto(path, apBody);
  apBody.fill(0, enc.written, HEADER_MAX_PATH_SIZE);
  dvBody.setUint32(HEADER_OFFSET_FLAGS, flags);

  const digest = computeDigest(apBody);

  sah.write(apBody, { at: 0 });
  sah.write(digest, { at: HEADER_OFFSET_DIGEST });
  sah.flush();
}

self.onmessage = async (e) => {
  const { sqliteBytes, vfsDir, opaqueDirName, dbPath, poolCapacity } = e.data;
  try {
    const root = await navigator.storage.getDirectory();
    console.log("[import:worker] Got OPFS root");

    // Delete existing VFS directory
    try {
      await root.removeEntry(vfsDir, { recursive: true });
      console.log("[import:worker] Removed existing " + vfsDir);
    } catch {
      console.log("[import:worker] No existing " + vfsDir + " to remove");
    }

    // Create fresh directory structure
    const vfsDirHandle = await root.getDirectoryHandle(vfsDir, { create: true });
    const opaqueDir = await vfsDirHandle.getDirectoryHandle(opaqueDirName, { create: true });
    console.log("[import:worker] Created " + vfsDir + "/" + opaqueDirName + "/");

    const bytes = new Uint8Array(sqliteBytes);

    // Pool file 1: The imported database
    const dbFileName = Math.random().toString(36).slice(2);
    const dbFileHandle = await opaqueDir.getFileHandle(dbFileName, { create: true });
    const dbSAH = await dbFileHandle.createSyncAccessHandle();

    // Write SQLite data at offset 4096
    dbSAH.truncate(HEADER_OFFSET_DATA + bytes.byteLength);
    const nWrote = dbSAH.write(bytes, { at: HEADER_OFFSET_DATA });

    // Force journal mode (not WAL) — matches sqlite-wasm importDb behavior
    dbSAH.write(new Uint8Array([1, 1]), { at: HEADER_OFFSET_DATA + 18 });

    // Write the header (path + flags + digest)
    setAssociatedPath(dbSAH, dbPath, SQLITE_OPEN_MAIN_DB);
    dbSAH.close();

    console.log("[import:worker] Pool file 1/" + poolCapacity + ": " + dbFileName + " = " + dbPath + " (" + nWrote + "B data)");

    // Pool files 2..N: Empty placeholders
    for (let i = 2; i <= poolCapacity; i++) {
      const name = Math.random().toString(36).slice(2);
      const fh = await opaqueDir.getFileHandle(name, { create: true });
      const sah = await fh.createSyncAccessHandle();
      sah.truncate(HEADER_OFFSET_DATA);
      setAssociatedPath(sah, "", 0);
      sah.close();
      console.log("[import:worker] Pool file " + i + "/" + poolCapacity + ": " + name + " = empty");
    }

    console.log("[import:worker] Done. Created " + poolCapacity + " pool files.");
    self.postMessage({ success: true, bytesWritten: nWrote });
  } catch (error) {
    console.error("[import:worker] Error:", error);
    self.postMessage({ success: false, error: error.message || String(error) });
  }
};
`;
}

/**
 * Write SQLite bytes to the OPFS SAH Pool using an inline Web Worker.
 *
 * Uses createSyncAccessHandle() — the same API that sqlite-wasm's opfs-sahpool
 * VFS uses — to guarantee the written files are readable by the VFS.
 * This avoids potential incompatibilities between the main-thread File API
 * (createWritable) and the Worker-only sync API (createSyncAccessHandle).
 */
function writeToOPFSviaWorker(sqliteBytes: Uint8Array): Promise<void> {
	return new Promise((resolve, reject) => {
		const blob = new Blob([getWorkerCode()], {
			type: "application/javascript",
		});
		const workerUrl = URL.createObjectURL(blob);
		const worker = new Worker(workerUrl);

		worker.onmessage = (e: MessageEvent) => {
			const { success, error, bytesWritten } = e.data;
			worker.terminate();
			URL.revokeObjectURL(workerUrl);

			if (success) {
				console.log(
					`[import:phase2] Worker wrote ${bytesWritten}B to OPFS`,
				);
				resolve();
			} else {
				reject(new Error(`Worker OPFS write failed: ${error}`));
			}
		};

		worker.onerror = (e: ErrorEvent) => {
			worker.terminate();
			URL.revokeObjectURL(workerUrl);
			reject(new Error(`Worker error: ${e.message}`));
		};

		// Transfer the buffer to the Worker for zero-copy performance
		const buffer = sqliteBytes.buffer.slice(
			sqliteBytes.byteOffset,
			sqliteBytes.byteOffset + sqliteBytes.byteLength,
		);
		worker.postMessage(
			{
				sqliteBytes: buffer,
				vfsDir: OPFS_VFS_DIR,
				opaqueDirName: OPAQUE_DIR_NAME,
				dbPath: EVOLU_DB_PATH,
				poolCapacity: SAH_POOL_INITIAL_CAPACITY,
			},
			[buffer],
		);
	});
}
