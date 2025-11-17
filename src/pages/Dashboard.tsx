import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Badge } from "../components/ui/Badge";
import { fetchClaims, fetchHealth, fetchPolicies } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatNumber } from "../utils/format";
import styles from "./Dashboard.module.css";

export const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ["policies", isAdmin ? "all" : user?.userId],
    queryFn: () => fetchPolicies(), // Backend automatically filters by userId for non-admin users
    enabled: !!user, // Only fetch when user is available
  });
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["claims", "all"],
    queryFn: () => fetchClaims(),
  });
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: () => fetchHealth(),
    enabled: isAdmin, // Only fetch health data for admin users
  });

  const metrics = useMemo(() => {
    const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);
    const approvedPayout = claims
      .filter((claim) => claim.status === "APPROVED")
      .reduce((sum, claim) => sum + (claim.payoutAmount ?? 0), 0);
    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter((policy) => policy.status === "ACTIVE").length,
      pendingClaims: claims.filter((claim) => claim.status === "SUBMITTED").length,
      approvedPayout,
      avgPremium: policies.length ? totalPremium / policies.length : 0,
    };
  }, [policies, claims]);

  const latestPolicies = policies.slice(0, 5);
  const latestClaims = claims.slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.metrics}>
        <Card>
          <CardHeader title="Total Policies" />
          <CardContent>
            <div className={styles.metricValue}>{formatNumber(metrics.totalPolicies)}</div>
            <div className={styles.metricLabel}>All policies across InsureFlow</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Active Policies" />
          <CardContent>
            <div className={styles.metricValue}>{formatNumber(metrics.activePolicies)}</div>
            <div className={styles.metricLabel}>Currently active and billing</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Pending Claims" />
          <CardContent>
            <div className={styles.metricValue}>{formatNumber(metrics.pendingClaims)}</div>
            <div className={styles.metricLabel}>Awaiting adjudication</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Approved Payouts" />
          <CardContent>
            <div className={styles.metricValue}>{formatCurrency(metrics.approvedPayout)}</div>
            <div className={styles.metricLabel}>Total approved claim payouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Average Premium" />
          <CardContent>
            <div className={styles.metricValue}>{formatCurrency(metrics.avgPremium)}</div>
            <div className={styles.metricLabel}>Across all policies</div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.sectionGrid}>
        <Card>
          <CardHeader title="Latest Policies" description="Recent policy issuances" />
          <CardContent>
            <DataTable
              data={latestPolicies}
              columns={[
                { key: "policyId", header: "Policy" },
                ...(isAdmin ? [{ key: "userId", header: "User" }] : []),
                { key: "premium", header: "Premium", render: (row) => formatCurrency(row.premium) },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <Badge variant={row.status === "ACTIVE" ? "success" : "warning"}>{row.status}</Badge>,
                },
              ]}
              emptyMessage={policiesLoading ? "Loading..." : "No policy data"}
            />
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardHeader title="Platform Health" description="Services" />
            <CardContent>
              <ul className={styles.healthList}>
                <li className={styles.healthItem}>
                  <span className={styles.healthService}>S3</span>
                  <span
                    className={`${styles.healthStatus} ${
                      health?.s3 === "ok"
                        ? styles.healthStatusOk
                        : health?.s3 === "error"
                        ? styles.healthStatusError
                        : styles.healthStatusChecking
                    }`}
                  >
                    <span
                      className={`${styles.healthStatusIndicator} ${
                        health?.s3 === "ok"
                          ? styles.healthStatusIndicatorOk
                          : health?.s3 === "error"
                          ? styles.healthStatusIndicatorError
                          : styles.healthStatusIndicatorChecking
                      }`}
                    />
                    {health?.s3 ?? "checking"}
                  </span>
                </li>
                <li className={styles.healthItem}>
                  <span className={styles.healthService}>DynamoDB</span>
                  <span
                    className={`${styles.healthStatus} ${
                      health?.dynamodb === "ok"
                        ? styles.healthStatusOk
                        : health?.dynamodb === "error"
                        ? styles.healthStatusError
                        : styles.healthStatusChecking
                    }`}
                  >
                    <span
                      className={`${styles.healthStatusIndicator} ${
                        health?.dynamodb === "ok"
                          ? styles.healthStatusIndicatorOk
                          : health?.dynamodb === "error"
                          ? styles.healthStatusIndicatorError
                          : styles.healthStatusIndicatorChecking
                      }`}
                    />
                    {health?.dynamodb ?? "checking"}
                  </span>
                </li>
                <li className={styles.healthItem}>
                  <span className={styles.healthService}>Lambda</span>
                  <span
                    className={`${styles.healthStatus} ${
                      health?.lambda === "ok"
                        ? styles.healthStatusOk
                        : health?.lambda === "error"
                        ? styles.healthStatusError
                        : styles.healthStatusChecking
                    }`}
                  >
                    <span
                      className={`${styles.healthStatusIndicator} ${
                        health?.lambda === "ok"
                          ? styles.healthStatusIndicatorOk
                          : health?.lambda === "error"
                          ? styles.healthStatusIndicatorError
                          : styles.healthStatusIndicatorChecking
                      }`}
                    />
                    {health?.lambda ?? "checking"}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader title="Latest Claims" description="Monitor claim progression" />
        <CardContent>
          <DataTable
            data={latestClaims}
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
            ]}
            emptyMessage={claimsLoading ? "Loading..." : "No claim activity"}
          />
        </CardContent>
      </Card>
    </div>
  );
};
