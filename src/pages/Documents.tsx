import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { useToast } from "../context/ToastContext";
import { fetchClaimDocuments, presignDownload } from "../api/services";
import type { DocumentInfo } from "../types";

export const DocumentsPage = () => {
  const { showToast } = useToast();
  const [claimId, setClaimId] = useState("");
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);

  const fetchMutation = useMutation({
    mutationFn: (id: string) => fetchClaimDocuments(id),
    onSuccess: (items) => {
      setDocuments(items);
      showToast({ title: `Found ${items.length} documents`, variant: "success" });
    },
    onError: () => showToast({ title: "Failed to list documents", variant: "error" }),
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!claimId) return;
    fetchMutation.mutate(claimId);
  };

  return (
    <Card>
      <CardHeader title="Claim documents" description="Generate presigned links for evidence uploads." />
      <CardContent>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-end" }}>
          <FormField label="Claim ID">
            <Input value={claimId} onChange={(event) => setClaimId(event.target.value)} placeholder="claim-123" />
          </FormField>
          <Button type="submit" isLoading={fetchMutation.isPending}>
            Fetch documents
          </Button>
        </form>

        <div style={{ marginTop: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {documents.length === 0 ? (
            <span style={{ color: "var(--color-text-muted)" }}>No documents yet.</span>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-sm) var(--space-md)",
                  background: "var(--color-surface)",
                }}
              >
                <span>{doc.key}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const url = await presignDownload(doc.key);
                    window.open(url, "_blank");
                  }}
                >
                  Download
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
