import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  adjudicateClaim,
  createClaim,
  fetchClaimDocuments,
  fetchClaims,
  fetchPolicy,
  presignClaimUpload,
  presignDownload,
  submitClaim,
} from "../api/services";
import type { Claim, ClaimStatus, DocumentInfo, Policy } from "../types";
import { formatCurrency } from "../utils/format";
import styles from "./Claims.module.css";

const createClaimSchema = z.object({
  policyId: z.string().min(3, "Policy required"),
  description: z.string().min(6, "Description required"),
});

const payoutField = z.number().refine((value) => !Number.isNaN(value), "Payout amount is required");

const adjudicateSchema = z.object({
  decision: z.enum(["APPROVED", "DENIED"] as [ClaimStatus, ClaimStatus]),
  payoutAmount: payoutField.nonnegative().optional(),
});
type AdjudicateInput = z.infer<typeof adjudicateSchema>;

type ClaimsAction = "create" | "upload" | "submit" | "adjudicate" | "documents" | "viewPolicy";

export const ClaimsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [action, setAction] = useState<ClaimsAction | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["claims", statusFilter],
    queryFn: () => (statusFilter === "ALL" ? fetchClaims() : fetchClaims({ status: statusFilter })),
  });

  const newClaimForm = useForm<z.infer<typeof createClaimSchema>>({ resolver: zodResolver(createClaimSchema) });
  const adjudicateForm = useForm<AdjudicateInput>({ resolver: zodResolver(adjudicateSchema) });

  const createMutation = useMutation({
    mutationFn: createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      showToast({ title: "Claim created", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Failed to create claim", variant: "error" }),
  });

  const submitMutation = useMutation({
    mutationFn: submitClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      showToast({ title: "Claim submitted", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Submission failed", variant: "error" }),
  });

  const adjudicateMutation = useMutation({
    mutationFn: ({ claimId, decision, payoutAmount }: { claimId: string; decision: ClaimStatus; payoutAmount?: number }) =>
      adjudicateClaim(claimId, { decision, payoutAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      showToast({ title: "Claim reviewed", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Failed to review claim", variant: "error" }),
  });

  const closeModal = () => {
    setAction(null);
    setSelectedClaim(null);
    setSelectedPolicy(null);
    newClaimForm.reset();
    adjudicateForm.reset();
    setDocuments([]);
    setLoadingDocuments(false);
    setLoadingPolicy(false);
  };

  const openAction = (claim: Claim, next: ClaimsAction) => {
    setSelectedClaim(claim);
    setAction(next);
    if (next === "documents") {
      setLoadingDocuments(true);
      fetchClaimDocuments(claim.claimId)
        .then(setDocuments)
        .catch(() => {
          showToast({ title: "Failed to load documents", variant: "error" });
        })
        .finally(() => {
          setLoadingDocuments(false);
        });
    }
    if (next === "viewPolicy") {
      setLoadingPolicy(true);
      fetchPolicy(claim.policyId)
        .then(setSelectedPolicy)
        .catch(() => {
          showToast({ title: "Failed to load policy", variant: "error" });
          setAction(null);
        })
        .finally(() => {
          setLoadingPolicy(false);
        });
    }
    if (next === "adjudicate") {
      adjudicateForm.reset({ decision: "APPROVED", payoutAmount: claim.payoutAmount ?? 0 });
    }
  };

  const handleUpload = async (file: File) => {
    if (!selectedClaim) return;
    try {
      setUploading(true);
      const presign = await presignClaimUpload(selectedClaim.claimId, {
        filename: file.name,
        contentType: file.type,
      });
      
      // Important: Don't set Content-Type header if it's already in the presigned URL
      // S3 presigned URLs include Content-Type in the signature, so we must match it exactly
      const headers: Record<string, string> = {};
      if (presign.contentType) {
        headers["Content-Type"] = presign.contentType;
      }
      
      const response = await fetch(presign.url, {
        method: "PUT",
        headers: headers,
        body: file,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      showToast({ title: "Document uploaded", variant: "success" });
      setLoadingDocuments(true);
      try {
        const updated = await fetchClaimDocuments(selectedClaim.claimId);
        setDocuments(updated);
      } finally {
        setLoadingDocuments(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      showToast({ title: "Upload failed", description: errorMessage, variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <FormField label="Status" htmlFor="claimStatus">
          <Select
            id="claimStatus"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClaimStatus | "ALL")}
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="DENIED">Denied</option>
          </Select>
        </FormField>
        <Button onClick={() => setAction("create")}>New Claim</Button>
      </div>

      <DataTable
        data={claims}
        columns={[
          { key: "claimId", header: "Claim" },
          { key: "policyId", header: "Policy" },
          { key: "description", header: "Description" },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              const variant = row.status === "APPROVED" ? "success" : row.status === "DENIED" ? "danger" : "info";
              return <Badge variant={variant}>{row.status}</Badge>;
            },
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className={styles.claimActions}>
                <Button size="sm" variant="ghost" onClick={() => openAction(row, "documents")}>
                  Documents
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openAction(row, "upload")}>
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openAction(row, "submit")}
                  disabled={row.status !== "DRAFT"}
                >
                  Submit
                </Button>
                {user?.role === "ADMIN" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openAction(row, "viewPolicy")}
                    >
                      View Policy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openAction(row, "adjudicate")}>
                      Review
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
        emptyMessage={isLoading ? "Loading claims..." : "No claims"}
      />

      <Modal isOpen={action === "create"} onClose={closeModal} title="Create claim" footer={null}>
        <form onSubmit={newClaimForm.handleSubmit((values) => createMutation.mutate(values))}>
          <FormField label="Policy ID" error={newClaimForm.formState.errors.policyId?.message}>
            <Input {...newClaimForm.register("policyId")} placeholder="policy-123" />
          </FormField>
          <FormField label="Description" error={newClaimForm.formState.errors.description?.message}>
            <Textarea {...newClaimForm.register("description")} placeholder="Describe the incident" />
          </FormField>
          <div className={styles.claimActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={action === "upload" && !!selectedClaim}
        onClose={closeModal}
        title={`Upload evidence for ${selectedClaim?.claimId}`}
        footer={null}
      >
        <input
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
              event.target.value = "";
            }
          }}
        />
        <p style={{ marginTop: "var(--space-sm)", fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
          Upload evidence files. Ensure you submit the claim afterwards.
        </p>
        {uploading && <p>Uploading...</p>}
      </Modal>

      <Modal
        isOpen={action === "submit" && !!selectedClaim}
        onClose={closeModal}
        title={`Submit ${selectedClaim?.claimId}`}
        footer={null}
      >
        <p>Once submitted, the claim will be locked for adjudication.</p>
        <div className={styles.claimActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-lg)" }}>
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedClaim && submitMutation.mutate(selectedClaim.claimId)}
            isLoading={submitMutation.isPending}
          >
            Submit claim
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={action === "adjudicate" && !!selectedClaim}
        onClose={closeModal}
        title={`Review Claim ${selectedClaim?.claimId}`}
        footer={null}
      >
        <form
          onSubmit={adjudicateForm.handleSubmit((values) =>
            selectedClaim &&
              adjudicateMutation.mutate({
                claimId: selectedClaim.claimId,
                decision: values.decision,
                payoutAmount: values.decision === "APPROVED" ? values.payoutAmount : 0,
              })
          )}
        >
          <FormField label="Decision">
            <Select {...adjudicateForm.register("decision")}>
              <option value="APPROVED">Approve</option>
              <option value="DENIED">Deny</option>
            </Select>
          </FormField>
          {adjudicateForm.watch("decision") === "APPROVED" && (
            <FormField label="Payout amount" error={adjudicateForm.formState.errors.payoutAmount?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...adjudicateForm.register("payoutAmount", { valueAsNumber: true })}
              />
            </FormField>
          )}
          <div className={styles.claimActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={adjudicateMutation.isPending}>
              Save decision
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={action === "documents" && !!selectedClaim}
        onClose={closeModal}
        title={`Documents for ${selectedClaim?.claimId}`}
        footer={null}
      >
        <div className={styles.documentsList}>
          {loadingDocuments ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "var(--space-md)" }}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <span>No documents uploaded.</span>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.key}
                onClick={async () => {
                  const url = await presignDownload(doc.key);
                  window.open(url, "_blank");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-primary)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {doc.key}
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={action === "viewPolicy" && !!selectedClaim}
        onClose={closeModal}
        title={`Policy Details - ${selectedPolicy?.policyId || selectedClaim?.policyId}`}
        footer={null}
      >
        {loadingPolicy ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "var(--space-md)" }}>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Loading policy details...</span>
          </div>
        ) : selectedPolicy ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <FormField label="Policy ID">
                <Input value={selectedPolicy.policyId} disabled />
              </FormField>
              <FormField label="User ID">
                <Input value={selectedPolicy.userId} disabled />
              </FormField>
              <FormField label="Status">
                <div>
                  <Badge
                    variant={
                      selectedPolicy.status === "ACTIVE"
                        ? "success"
                        : selectedPolicy.status === "SUSPENDED"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {selectedPolicy.status}
                  </Badge>
                </div>
              </FormField>
              <FormField label="Coverage Amount">
                <Input value={formatCurrency(selectedPolicy.coverageAmount)} disabled />
              </FormField>
              <FormField label="Premium">
                <Input value={formatCurrency(selectedPolicy.premium)} disabled />
              </FormField>
              <FormField label="Term (months)">
                <Input value={selectedPolicy.termMonths} disabled />
              </FormField>
              <FormField label="Created At">
                <Input value={new Date(selectedPolicy.createdAt).toLocaleString()} disabled />
              </FormField>
              <FormField label="Updated At">
                <Input value={new Date(selectedPolicy.updatedAt).toLocaleString()} disabled />
              </FormField>
              {selectedPolicy.suspendedReason && (
                <FormField label="Suspension Reason">
                  <Textarea value={selectedPolicy.suspendedReason} disabled rows={3} />
                </FormField>
              )}
            </div>
            <div className={styles.claimActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
              <Button type="button" variant="ghost" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "var(--space-md)" }}>
            <span>Failed to load policy details.</span>
          </div>
        )}
      </Modal>
    </div>
  );
};
