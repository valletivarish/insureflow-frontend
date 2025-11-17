export type Role = "USER" | "ADMIN";

export interface AuthUser {
  username: string;
  role: Role;
  userId: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface QuoteInput {
  age: number;
  coverageAmount: number;
  riskFactors: string[];
}

export interface QuoteResult {
  premium: number;
  currency: string;
}

export type PolicyStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";

export interface Policy {
  policyId: string;
  userId: string;
  status: PolicyStatus;
  coverageAmount: number;
  premium: number;
  termMonths: number;
  createdAt: string;
  updatedAt: string;
  suspendedReason?: string | null;
}

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "DENIED";

export interface Claim {
  claimId: string;
  policyId: string;
  status: ClaimStatus;
  description: string;
  payoutAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresignedUpload {
  url: string;
  key: string;
  contentType?: string | null;
}

export interface DocumentInfo {
  key: string;
  lastModified?: string | null;
  size?: number | null;
}
