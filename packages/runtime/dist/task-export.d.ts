import { AgentTaskExport, ReviewStatus, ReviewStore, SourceMapDocument } from "./types.js";
export interface ExportOptions {
    workspaceRoot?: string;
    includeStatuses?: ReviewStatus[];
}
export declare function exportAgentTasks(store: ReviewStore, sourceMap: SourceMapDocument, options?: ExportOptions): AgentTaskExport;
