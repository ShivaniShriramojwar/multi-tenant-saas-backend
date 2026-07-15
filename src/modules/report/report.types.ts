export type ReportFormat = "json" | "csv" | "excel" | "pdf";

export interface ReportQuery {
  fromDate?: Date;
  toDate?: Date;
  format: ReportFormat;
  upload: boolean;
}

export interface ReportExport {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export interface ReportResult {
  reportType: string;
  generatedAt: Date;
  data?: unknown;
  export?: {
    filename: string;
    contentType: string;
    downloadUrl?: string;
    s3Key?: string;
  };
}
