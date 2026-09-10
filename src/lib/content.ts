import type { SiteContent } from "./types";
import defaultContent from "../../shared/content.default.json";

/**
 * Fallback-content die gebruikt wordt vóórdat de API reageert (of wanneer de
 * site zonder backend wordt bekeken). De live content komt uit SQLite via de
 * admin-omgeving.
 */
export const DEFAULT_CONTENT = defaultContent as unknown as SiteContent;
