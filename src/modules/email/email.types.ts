import { EmailStatus } from "./email.model";

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  templateKey?: string;
  sendNow?: boolean;
}

export interface EmailLogListQuery {
  page: number;
  limit: number;
  skip: number;
  status?: EmailStatus;
  requestedBy?: string;
  templateKey?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface EmailSummaryQuery {
  requestedBy?: string;
  templateKey?: string;
  fromDate?: Date;
  toDate?: Date;
}
