import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { calculateQuote, createPolicy, fetchPolicies, reinstatePolicy, renewPolicy, suspendPolicy } from "../api/services";
import { formatCurrency } from "../utils/format";
import type { Policy, PolicyStatus } from "../types";
import styles from "./Policies.module.css";

const numericField = (label: string) =>
  z.number().refine((value) => !Number.isNaN(value), `${label} is required`);

const createPolicySchema = z.object({
  userId: z.string().min(3, "User ID required"),
  age: numericField("Age")
    .int("Age must be a whole number")
    .min(18, "Age must be at least 18")
    .max(100, "Age cannot exceed 100"),
  coverageAmount: numericField("Coverage amount")
    .min(1000, "Coverage amount must be at least €1,000"),
  premium: numericField("Premium")
    .positive("Premium must be greater than 0")
    .min(0.01, "Premium must be greater than 0"),
  termMonths: numericField("Term")
    .int("Term must be a whole number")
    .min(12, "Term must be at least 12 months")
    .max(360, "Term cannot exceed 360 months (30 years)"),
  quoteId: z.string().optional(),
});
type CreatePolicyInput = z.infer<typeof createPolicySchema>;

const renewSchema = z.object({
  extendMonths: numericField("Months")
    .int("Months must be a whole number")
    .positive("Months must be greater than 0")
    .min(1, "Must extend by at least 1 month"),
});
type RenewInput = z.infer<typeof renewSchema>;

const suspendSchema = z.object({ reason: z.string().min(4, "Provide a reason") });
type SuspendInput = z.infer<typeof suspendSchema>;

type PolicyAction = "renew" | "suspend" | "reinstate";

export const PoliciesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | "ALL">("ALL");
  const [action, setAction] = useState<PolicyAction | "create" | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies", statusFilter, isAdmin ? "all" : user?.userId],
    queryFn: () => {
      // Backend automatically filters by userId for non-admin users
      if (statusFilter === "ALL") {
        return fetchPolicies();
      }
      return fetchPolicies({ status: statusFilter as PolicyStatus });
    },
    enabled: !!user, // Only fetch when user is available
  });

  const createForm = useForm<CreatePolicyInput>({
    resolver: zodResolver(createPolicySchema),
    defaultValues: {
      userId: user?.userId || "",
    },
  });

  const quoteMutation = useMutation({
    mutationFn: calculateQuote,
    onSuccess: (data) => {
      createForm.setValue("premium", data.premium);
    },
    onError: () => {
      showToast({ title: "Failed to calculate premium", variant: "error" });
    },
  });

  // Watch age, coverage amount and term to auto-calculate premium
  const age = createForm.watch("age");
  const coverageAmount = createForm.watch("coverageAmount");
  const termMonths = createForm.watch("termMonths");

  useEffect(() => {
    if (age && age >= 18 && age <= 100 && coverageAmount && coverageAmount >= 1000 && termMonths && termMonths >= 12) {
      // Calculate premium with entered age and no risk factors
      quoteMutation.mutate({
        age,
        coverageAmount,
        riskFactors: [],
      });
    }
  }, [age, coverageAmount, termMonths]);
  const renewForm = useForm<RenewInput>({ resolver: zodResolver(renewSchema) });
  const suspendForm = useForm<SuspendInput>({ resolver: zodResolver(suspendSchema) });

  const closeModal = () => {
    setAction(null);
    setSelectedPolicy(null);
    createForm.reset();
    renewForm.reset();
    suspendForm.reset();
  };

  const createMutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      showToast({ title: "Policy created", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Failed to create policy", variant: "error" }),
  });

  const renewMutation = useMutation({
    mutationFn: ({ policyId, extendMonths }: { policyId: string; extendMonths: number }) =>
      renewPolicy(policyId, extendMonths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      showToast({ title: "Policy renewed", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Renewal failed", variant: "error" }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ policyId, reason }: { policyId: string; reason: string }) => suspendPolicy(policyId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      showToast({ title: "Policy suspended", variant: "warning" });
      closeModal();
    },
    onError: () => showToast({ title: "Could not suspend policy", variant: "error" }),
  });

  const reinstateMutation = useMutation({
    mutationFn: (policyId: string) => reinstatePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      showToast({ title: "Policy reinstated", variant: "success" });
      closeModal();
    },
    onError: () => showToast({ title: "Reinstate failed", variant: "error" }),
  });

  const openAction = (policy: Policy, nextAction: PolicyAction) => {
    setSelectedPolicy(policy);
    setAction(nextAction);
    if (nextAction === "renew") {
      renewForm.reset({ extendMonths: 12 });
    }
  };

  const filteredPolicies = useMemo(() => policies, [policies]);

  return (
    <div className={styles.page}>
      <div className={styles.filters}>
        <FormField label="Status" htmlFor="status">
          <Select
            id="status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PolicyStatus | "ALL")}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        </FormField>
        <div className={styles.actions}>
          <Button onClick={() => setAction("create")}>New Policy</Button>
        </div>
      </div>

      <div className={styles.tableSection}>
        <DataTable
          data={filteredPolicies}
          columns={[
            { key: "policyId", header: "Policy ID" },
            ...(isAdmin ? [{ key: "userId", header: "User" }] : []),
            { key: "coverageAmount", header: "Coverage", render: (row) => formatCurrency(row.coverageAmount) },
            { key: "premium", header: "Premium", render: (row) => formatCurrency(row.premium) },
            {
              key: "status",
              header: "Status",
              render: (row) => {
                const variant = row.status === "ACTIVE" ? "success" : row.status === "SUSPENDED" ? "warning" : "neutral";
                return <Badge variant={variant}>{row.status}</Badge>;
              },
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => {
                const canRenew = isAdmin || user?.userId === row.userId;
                const canSuspend = isAdmin;
                const canReinstate = isAdmin;
                
                if (!canRenew && !canSuspend && !canReinstate) {
                  return <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-xs)" }}>No actions available</span>;
                }
                
                return (
                  <div className={styles.inlineActions}>
                    {canRenew && (
                      <Button size="sm" variant="ghost" onClick={() => openAction(row, "renew")}>
                        Renew
                      </Button>
                    )}
                    {canSuspend && (
                      <Button size="sm" variant="ghost" onClick={() => openAction(row, "suspend")}>
                        Suspend
                      </Button>
                    )}
                    {canReinstate && (
                      <Button size="sm" variant="ghost" onClick={() => openAction(row, "reinstate")}>
                        Reinstate
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          emptyMessage={isLoading ? "Loading policies..." : "No policies found"}
        />
      </div>

      <Modal isOpen={action === "create"} onClose={closeModal} title="Create policy" footer={null}>
        <form
          onSubmit={createForm.handleSubmit((values) =>
            createMutation.mutate({
              userId: values.userId,
              coverageAmount: values.coverageAmount,
              premium: values.premium,
              termMonths: values.termMonths,
              quoteId: values.quoteId,
            })
          )}
        >
          <FormField label="User ID" error={createForm.formState.errors.userId?.message}>
            <Input 
              {...createForm.register("userId")} 
              placeholder="user-001"
              disabled={!isAdmin}
              title={!isAdmin ? "You can only create policies for yourself" : ""}
            />
          </FormField>
          <FormField label="Age" error={createForm.formState.errors.age?.message}>
            <Input
              type="number"
              min="18"
              max="100"
              placeholder="Applicant age"
              {...createForm.register("age", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField label="Coverage (€)" error={createForm.formState.errors.coverageAmount?.message}>
            <Input
              type="number"
              step="1000"
              min="1000"
              placeholder="Minimum €1,000"
              {...createForm.register("coverageAmount", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField 
            label="Premium (€)" 
            error={createForm.formState.errors.premium?.message}
            hint="Premium is automatically calculated based on age, coverage amount, and term."
          >
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Calculated automatically"
              disabled
              {...createForm.register("premium", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField label="Term (months)" error={createForm.formState.errors.termMonths?.message}>
            <Input
              type="number"
              min="12"
              max="360"
              step="1"
              placeholder="Minimum 12 months"
              {...createForm.register("termMonths", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField label="Quote ID (optional)" error={createForm.formState.errors.quoteId?.message}>
            <Input {...createForm.register("quoteId")} />
          </FormField>
          <div className={styles.inlineActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
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
        isOpen={action === "renew" && !!selectedPolicy}
        onClose={closeModal}
        title={`Renew ${selectedPolicy?.policyId}`}
        footer={null}
      >
        <form
          onSubmit={renewForm.handleSubmit((values) =>
            selectedPolicy && renewMutation.mutate({ policyId: selectedPolicy.policyId, extendMonths: values.extendMonths })
          )}
        >
          <FormField label="Extend by (months)" error={renewForm.formState.errors.extendMonths?.message}>
            <Input
              type="number"
              min="1"
              step="1"
              {...renewForm.register("extendMonths", {
                valueAsNumber: true,
                validate: (value) => (Number.isInteger(value) && value > 0) || "Must extend by at least 1 month",
              })}
            />
          </FormField>
          <div className={styles.inlineActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={renewMutation.isPending}>
              Renew policy
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={action === "suspend" && !!selectedPolicy}
        onClose={closeModal}
        title={`Suspend ${selectedPolicy?.policyId}`}
        footer={null}
      >
        <form
          onSubmit={suspendForm.handleSubmit((values) =>
            selectedPolicy && suspendMutation.mutate({ policyId: selectedPolicy.policyId, reason: values.reason })
          )}
        >
          <FormField label="Reason" error={suspendForm.formState.errors.reason?.message}>
            <Input {...suspendForm.register("reason")} placeholder="Add suspension rationale" />
          </FormField>
          <div className={styles.inlineActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-md)" }}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" isLoading={suspendMutation.isPending}>
              Suspend
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={action === "reinstate" && !!selectedPolicy}
        onClose={closeModal}
        title={`Reinstate ${selectedPolicy?.policyId}`}
        footer={null}
      >
        <p>Reinstate this policy to ACTIVE status?</p>
        <div className={styles.inlineActions} style={{ justifyContent: "flex-end", marginTop: "var(--space-lg)" }}>
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="solid"
            onClick={() => selectedPolicy && reinstateMutation.mutate(selectedPolicy.policyId)}
            isLoading={reinstateMutation.isPending}
          >
            Reinstate
          </Button>
        </div>
      </Modal>
    </div>
  );
};
