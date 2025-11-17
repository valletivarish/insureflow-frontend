import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Badge } from "../components/ui/Badge";
import { fetchClaims, fetchPolicies } from "../api/services";

export const AdminPage = () => {
  const { data: policies = [] } = useQuery({ queryKey: ["policies", "admin"], queryFn: () => fetchPolicies() });
  const { data: claims = [] } = useQuery({ queryKey: ["claims", "admin"], queryFn: () => fetchClaims() });

  const policyStats = useMemo(() => {
    const grouped: Record<string, number> = {};
    policies.forEach((policy) => {
      grouped[policy.status] = (grouped[policy.status] ?? 0) + 1;
    });
    return grouped;
  }, [policies]);

  const claimStats = useMemo(() => {
    const grouped: Record<string, number> = {};
    claims.forEach((claim) => {
      grouped[claim.status] = (grouped[claim.status] ?? 0) + 1;
    });
    return grouped;
  }, [claims]);

  return (
    <div style={{ display: "grid", gap: "var(--space-xl)" }}>
      <Card>
        <CardHeader title="Policy status overview" />
        <CardContent>
          <ul style={{ display: "flex", gap: "var(--space-lg)", flexWrap: "wrap" }}>
            {Object.entries(policyStats).map(([status, count]) => (
              <li key={status}>
                <Badge>{status}</Badge> · {count}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Claims by status" />
        <CardContent>
          <ul style={{ display: "flex", gap: "var(--space-lg)", flexWrap: "wrap" }}>
            {Object.entries(claimStats).map(([status, count]) => (
              <li key={status}>
                <Badge>{status}</Badge> · {count}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Recent claims" />
        <CardContent>
          <DataTable
            data={claims.slice(0, 10)}
            columns={[
              { key: "claimId", header: "Claim" },
              { key: "policyId", header: "Policy" },
              { key: "status", header: "Status" },
              {
                key: "payoutAmount",
                header: "Payout",
                render: (row) => (row.payoutAmount ? `€${row.payoutAmount.toFixed(2)}` : "-")
              },
            ]}
            emptyMessage="No recent claims"
          />
        </CardContent>
      </Card>
    </div>
  );
};
