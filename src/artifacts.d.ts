export interface ArtifactScan { ok: boolean; entriesChecked: number; filesChecked: number; violations: {path: string; rule: string}[]; }
export declare function scanArtifacts(directory: string, bounds?: {maxEntries?: number; maxBytesPerFile?: number}): Promise<ArtifactScan>;
