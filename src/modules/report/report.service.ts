import { uploadToS3, getS3SignedDownloadUrl } from "../../infrastructure/storage/s3";
import { AppError } from "../../common/errors/app-error";
import {
  getAuditReport,
  getBugReport,
  getOrderReport,
  getProjectReport,
  getTaskReport,
  getTeamWorkloadReport,
} from "./report.repository";
import { ReportExport, ReportQuery, ReportResult } from "./report.types";

const createHttpError = (message: string, statusCode = 400) => {
  return new AppError(message, statusCode);
};

const flattenValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const csvEscape = (value: unknown) => {
  const stringValue = flattenValue(value);
  return /[",\n\r]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
};

const normalizeRows = (data: unknown) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [{ value: data }];
  }

  return Object.entries(data as Record<string, unknown>).map(([metric, value]) => ({
    metric,
    value,
  }));
};

const createCsvExport = (reportType: string, data: unknown): ReportExport => {
  const rows = normalizeRows(data);
  const headers: string[] = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row as Record<string, unknown>).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape((row as Record<string, unknown>)[header]))
        .join(","),
    ),
  ].join("\n");

  return {
    filename: `${reportType}-report-${Date.now()}.csv`,
    contentType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  };
};

const getTableRows = (data: unknown) => {
  const rows = normalizeRows(data);
  const headers: string[] = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row as Record<string, unknown>).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );

  return { rows, headers };
};

const escapeHtml = (value: unknown) => {
  return flattenValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const createExcelExport = (reportType: string, data: unknown): ReportExport => {
  const { rows, headers } = getTableRows(data);
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<table>
<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
<tbody>
${rows
  .map(
    (row) =>
      `<tr>${headers
        .map((header) => `<td>${escapeHtml((row as Record<string, unknown>)[header])}</td>`)
        .join("")}</tr>`,
  )
  .join("\n")}
</tbody>
</table>
</body>
</html>`;

  return {
    filename: `${reportType}-report-${Date.now()}.xls`,
    contentType: "application/vnd.ms-excel",
    buffer: Buffer.from(html, "utf8"),
  };
};

const escapePdfText = (value: string) => {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
};

const createPdfExport = (reportType: string, data: unknown): ReportExport => {
  const lines = JSON.stringify(data, null, 2)
    .split("\n")
    .slice(0, 45)
    .map((line) => line.slice(0, 95));
  const textCommands = [
    `BT /F1 14 Tf 40 780 Td (${escapePdfText(`${reportType} report`)}) Tj ET`,
    ...lines.map((line, index) => {
      const y = 750 - index * 15;
      return `BT /F1 9 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`;
    }),
  ].join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(textCommands)} >> stream\n${textCommands}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    filename: `${reportType}-report-${Date.now()}.pdf`,
    contentType: "application/pdf",
    buffer: Buffer.from(pdf, "utf8"),
  };
};

const createExport = (reportType: string, data: unknown, query: ReportQuery) => {
  if (query.format === "csv") {
    return createCsvExport(reportType, data);
  }

  if (query.format === "excel") {
    return createExcelExport(reportType, data);
  }

  if (query.format === "pdf") {
    return createPdfExport(reportType, data);
  }

  return null;
};

const maybeUploadExport = async (
  tenantId: string,
  reportType: string,
  reportExport: ReportExport,
) => {
  const key = `reports/${tenantId}/${reportType}/${reportExport.filename}`;

  const uploaded = await uploadToS3({
    key,
    buffer: reportExport.buffer,
    contentType: reportExport.contentType,
  });

  const downloadUrl = await getS3SignedDownloadUrl({
    key: uploaded.key,
    filename: reportExport.filename,
    expiresIn: 300,
  });

  return {
    filename: reportExport.filename,
    contentType: reportExport.contentType,
    s3Key: uploaded.key,
    downloadUrl,
  };
};

const buildReportResult = async (
  tenantId: string,
  reportType: string,
  data: unknown,
  query: ReportQuery,
): Promise<ReportResult> => {
  const reportExport = createExport(reportType, data, query);

  if (!reportExport) {
    return {
      reportType,
      generatedAt: new Date(),
      data,
    };
  }

  if (query.upload) {
    return {
      reportType,
      generatedAt: new Date(),
      export: await maybeUploadExport(tenantId, reportType, reportExport),
    };
  }

  return {
    reportType,
    generatedAt: new Date(),
    data: reportExport,
  };
};

const getReportData = async (
  reportType: string,
  tenantId: string,
  query: ReportQuery,
) => {
  const reportFactories: Record<string, () => Promise<unknown>> = {
    projects: () => getProjectReport(tenantId, query),
    tasks: () => getTaskReport(tenantId, query),
    bugs: () => getBugReport(tenantId, query),
    "team-workload": () => getTeamWorkloadReport(tenantId, query),
    orders: () => getOrderReport(tenantId, query),
    audit: () => getAuditReport(tenantId, query),
  };

  const createReport = reportFactories[reportType];

  if (!createReport) {
    throw createHttpError("Report type not found", 404);
  }

  return createReport();
};

const getReportService = async (
  reportType: string,
  tenantId: string,
  query: ReportQuery,
) => {
  const data = await getReportData(reportType, tenantId, query);
  return buildReportResult(tenantId, reportType, data, query);
};

export { getReportService };
