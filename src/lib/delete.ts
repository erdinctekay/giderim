import { type TGroupId, type TTagId, evolu } from "@/evolu-db";
import { exclusionsQuery } from "@/evolu-queries";
import type { TPopulatedEntry } from "@/lib/populateEntries";
import dayjs from "dayjs";

export const deleteGroup = (groupId: TGroupId) => {
  evolu.update("entryGroup", { id: groupId, isDeleted: true });
};

export const deleteTag = (tagId: TTagId) => {
  evolu.update("entryTag", { id: tagId, isDeleted: true });
};

export async function deleteEntry(
  entry: TPopulatedEntry,
  applyToSubsequents = false,
  onComplete: () => void = () => {}
) {
  // if it's an exclusion
  if (entry.exclusionId) {
    evolu.update("exclusion", {
      id: entry.exclusionId,
      reason: "deletion",
      applyToSubsequents,
    });

    if (applyToSubsequents) {
      const allExclusions = await evolu.loadQuery(
        exclusionsQuery(entry.recurringConfigId!)
      );

      allExclusions.rows
        .filter((ex) => dayjs(ex.date).isAfter(dayjs(entry.date)))
        .forEach((ex) => {
          evolu.update("exclusion", {
            id: ex.exclusionId,
            isDeleted: true,
          });
        });
    }

    // if it's a single entry
  } else if (entry.id && !entry.recurringConfigId) {
    evolu.update("entry", { id: entry.id, isDeleted: true });
  } else {
    // if its's a ghost record
    evolu.create("exclusion", {
      recurringId: entry.recurringConfigId!,
      date: entry.date,
      index: entry.index,
      reason: "deletion",
      applyToSubsequents,
      modifiedEntryId: null,
    });

    if (applyToSubsequents) {
      const allExclusions = await evolu.loadQuery(
        exclusionsQuery(entry.recurringConfigId!)
      );

      allExclusions.rows
        .filter((ex) => dayjs(ex.date).isAfter(dayjs(entry.date)))
        .forEach((ex) => {
          evolu.update("exclusion", {
            id: ex.exclusionId,
            isDeleted: true,
          });
        });
    }
  }

  setTimeout(() => {
    // we need to wait for the dialog to close
    // because the entry is still open
    onComplete();
  }, 200);
}
