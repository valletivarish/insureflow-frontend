import { apiClient } from "./client";
import type {
  Claim,
  ClaimStatus,
  DocumentInfo,
  Policy,
  PolicyStatus,
  PresignedUpload,
  QuoteInput,
  QuoteResult,
  Token,
} from "../types";

export const fetchPolicies = async (params?: { userId?: string; status?: PolicyStatus }) => {
  const response = await apiClient.get<{ items: Policy[] }>("/policies", { params });
  return response.data.items;
};

export const fetchPolicy = async (policyId: string) => {
  const { data } = await apiClient.get<Policy>(`/policies/${policyId}`);
  return data;
};

export const createPolicy = async (payload: {
  userId: string;
  coverageAmount: number;
  premium: number;
  termMonths: number;
  quoteId?: string | null;
}) => {
  const { data } = await apiClient.post<Policy>("/policies", payload);
  return data;
};

export const renewPolicy = async (policyId: string, extendMonths: number) => {
  const { data } = await apiClient.post<Policy>(`/policies/${policyId}/renew`, { extendMonths });
  return data;
};

export const suspendPolicy = async (policyId: string, reason: string) => {
  const { data } = await apiClient.post<Policy>(`/policies/${policyId}/suspend`, { reason });
  return data;
};

export const reinstatePolicy = async (policyId: string) => {
  const { data } = await apiClient.post<Policy>(`/policies/${policyId}/reinstate`);
  return data;
};

export const fetchClaims = async (params?: { policyId?: string; status?: ClaimStatus }) => {
  const response = await apiClient.get<{ items: Claim[] }>("/claims", { params });
  return response.data.items;
};

export const createClaim = async (payload: { policyId: string; description: string }) => {
  const { data } = await apiClient.post<Claim>(`/claims`, payload);
  return data;
};

export const submitClaim = async (claimId: string) => {
  const { data } = await apiClient.post<Claim>(`/claims/${claimId}/submit`);
  return data;
};

export const adjudicateClaim = async (
  claimId: string,
  payload: { decision: ClaimStatus; payoutAmount?: number }
) => {
  const { data } = await apiClient.post<Claim>(`/claims/${claimId}/adjudicate`, payload);
  return data;
};

export const calculateQuote = async (payload: QuoteInput) => {
  // Lambda route is at /quote/calculate (without /api prefix)
  // Get base URL without /api suffix
  const lambdaBaseURL = (import.meta.env.VITE_API_BASE_URL || "https://7yum264ntc.execute-api.eu-west-1.amazonaws.com/prod/api")
    .replace(/\/api$/, "");
  
  const { data } = await apiClient.post<QuoteResult>("/quote/calculate", payload, {
    baseURL: lambdaBaseURL,
  });
  return data;
};

export const presignClaimUpload = async (claimId: string, payload: { filename: string; contentType?: string }) => {
  const { data } = await apiClient.post<PresignedUpload>(`/docs/${claimId}/presign-upload`, payload);
  return data;
};

export const fetchClaimDocuments = async (claimId: string) => {
  const { data } = await apiClient.get<{ items: DocumentInfo[] }>(`/docs/${claimId}/list`);
  return data.items;
};

export const presignDownload = async (key: string) => {
  const { data } = await apiClient.get<{ url: string }>("/docs/presign-download", { params: { key } });
  return data.url;
};

export const fetchHealth = async () => {
  const { data } = await apiClient.get<{ s3: string; dynamodb: string; lambda: string }>("/health");
  return data;
};

export const register = async (payload: { email: string; password: string; role?: "USER" | "ADMIN" }) => {
  const { data } = await apiClient.post<Token>("/auth/register", payload);
  return data;
};
