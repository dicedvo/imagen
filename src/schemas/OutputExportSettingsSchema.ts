// Export Scope
// - current: export the current record
// - selected: export the selected records
// - tagged: export the tagged records

import { z } from "zod";

// - all: export all records
export const exportScope = z.enum(["current", "selected", "all"]);
export const taggedExportScope = z
  .string()
  .startsWith("tagged:")
  .and(z.custom<`tagged:${string}`>());

export const outputExportSettingsSchema = z.object({
  exporterId: z.string(),
  exportScope: exportScope.or(taggedExportScope),
  filenameFormat: z.string(),
  settings: z.record(z.any()),
});
