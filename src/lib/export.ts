import { evolu } from "@/evolu-db";
import { cast } from "@evolu/react";

type TLogicalBackup = {
  version: 1;
  exportedAt: string;
  groups: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    suggestId: string | null;
    color: string | null;
    icon: string | null;
  }>;
  recurringConfigs: Array<{
    id: string;
    frequency: "week" | "month" | "year";
    interval: number;
    every: number;
    startDate: string;
    endDate: string | null;
  }>;
  entries: Array<{
    id: string;
    date: string;
    type: "income" | "expense";
    name: string;
    amount: string;
    fullfilled: number | boolean;
    currencyCode: string;
    recurringId: string | null;
    groupId: string | null;
    tagId: string | null;
  }>;
  exclusions: Array<{
    id: string;
    recurringId: string;
    date: string;
    index: number | null;
    modifiedDate: string | null;
    reason: "deletion" | "modification";
    applyToSubsequents: number | boolean;
    modifiedEntryId: string | null;
  }>;
};

function getTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replaceAll(":", "-").replaceAll("T", "-");
}

function downloadFile(content: BlobPart, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export the Evolu SQLite database as a .db file.
 * Downloads a file named giderim-backup_YYYY-MM-DD_HH-MM-SS.db
 */
export async function exportBackupData(): Promise<void> {
	try {
		const database = await evolu.exportDatabase();
    downloadFile(
      new Uint8Array(database),
      `giderim-backup_${getTimestamp()}.db`,
      "application/x-sqlite3"
    );
	} catch (error) {
		console.error("Backup export failed:", error);
	}
}

/**
 * Export logical application data as JSON (owner-agnostic).
 */
export async function exportLogicalData(): Promise<void> {
  try {
    const [groups, tags, recurringConfigs, entries, exclusions] = await Promise.all([
      evolu.loadQuery(
        evolu.createQuery((db) =>
          db
            .selectFrom("entryGroup")
            .select(["id", "name", "icon"])
            .where("isDeleted", "is not", cast(true))
            .orderBy("createdAt")
        )
      ),
      evolu.loadQuery(
        evolu.createQuery((db) =>
          db
            .selectFrom("entryTag")
            .select(["id", "name", "suggestId", "color", "icon"])
            .where("isDeleted", "is not", cast(true))
            .orderBy("createdAt")
        )
      ),
      evolu.loadQuery(
        evolu.createQuery((db) =>
          db
            .selectFrom("recurringConfig")
            .select(["id", "frequency", "interval", "every", "startDate", "endDate"])
            .where("isDeleted", "is not", cast(true))
            .orderBy("createdAt")
        )
      ),
      evolu.loadQuery(
        evolu.createQuery((db) =>
          db
            .selectFrom("entry")
            .select([
              "id",
              "date",
              "type",
              "name",
              "amount",
              "fullfilled",
              "currencyCode",
              "recurringId",
              "groupId",
              "tagId",
            ])
            .where("isDeleted", "is not", cast(true))
            .where("name", "is not", null)
            .where("type", "is not", null)
            .where("amount", "is not", null)
            .orderBy("createdAt")
        )
      ),
      evolu.loadQuery(
        evolu.createQuery((db) =>
          db
            .selectFrom("exclusion")
            .select([
              "id",
              "recurringId",
              "date",
              "index",
              "modifiedDate",
              "reason",
              "applyToSubsequents",
              "modifiedEntryId",
            ])
            .where("isDeleted", "is not", cast(true))
            .orderBy("createdAt")
        )
      ),
    ]);

    const payload: TLogicalBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      groups: groups.rows
        .filter((g) => !!g.id && !!g.name)
        .map((g) => ({
          id: g.id as string,
          name: g.name as string,
          icon: (g.icon as string | null) ?? null,
        })),
      tags: tags.rows
        .filter((t) => !!t.id && !!t.name)
        .map((t) => ({
          id: t.id as string,
          name: t.name as string,
          suggestId: (t.suggestId as string | null) ?? null,
          color: (t.color as string | null) ?? null,
          icon: (t.icon as string | null) ?? null,
        })),
      recurringConfigs: recurringConfigs.rows
        .filter(
          (r) =>
            !!r.id &&
            !!r.frequency &&
            typeof r.interval === "number" &&
            typeof r.every === "number" &&
            !!r.startDate
        )
        .map((r) => ({
          id: r.id as string,
          frequency: r.frequency as "week" | "month" | "year",
          interval: r.interval as number,
          every: r.every as number,
          startDate: String(r.startDate),
          endDate: r.endDate ? String(r.endDate) : null,
        })),
      entries: entries.rows
        .filter(
          (e) =>
            !!e.id &&
            !!e.name &&
            !!e.type &&
            !!e.amount &&
            !!e.date &&
            !!e.currencyCode
        )
        .map((e) => ({
          id: e.id as string,
          date: String(e.date),
          type: e.type as "income" | "expense",
          name: e.name as string,
          amount: e.amount as string,
          fullfilled: (e.fullfilled as number | boolean) ?? 0,
          currencyCode: e.currencyCode as string,
          recurringId: (e.recurringId as string | null) ?? null,
          groupId: (e.groupId as string | null) ?? null,
          tagId: (e.tagId as string | null) ?? null,
        })),
      exclusions: exclusions.rows
        .filter((ex) => !!ex.id && !!ex.recurringId && !!ex.date && !!ex.reason)
        .map((ex) => ({
          id: ex.id as string,
          recurringId: ex.recurringId as string,
          date: String(ex.date),
          index: (ex.index as number | null) ?? null,
          modifiedDate: ex.modifiedDate ? String(ex.modifiedDate) : null,
          reason: ex.reason as "deletion" | "modification",
          applyToSubsequents: (ex.applyToSubsequents as number | boolean) ?? 0,
          modifiedEntryId: (ex.modifiedEntryId as string | null) ?? null,
        })),
    };

    downloadFile(
      JSON.stringify(payload, null, 2),
      `giderim-data_${getTimestamp()}.json`,
      "application/json"
    );
  } catch (error) {
    console.error("Logical export failed:", error);
  }
}

// Backward-compatible alias for existing call sites.
export const exportData = exportBackupData;
