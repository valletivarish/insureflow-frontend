import clsx from "classnames";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { calculateQuote, createPolicy } from "../api/services";
import { formatCurrency, formatNumber } from "../utils/format";
import styles from "./Quotes.module.css";

const numberField = (label: string) =>
  z.number().refine((value) => !Number.isNaN(value), `${label} is required`);

const quoteSchema = z.object({
  age: numberField("Age").int().min(18).max(100),
  coverageAmount: numberField("Coverage amount").positive(),
  termMonths: numberField("Term").int().positive(),
});

type QuoteInputForm = z.infer<typeof quoteSchema>;

const RISK_OPTIONS = [
  { value: "smoker", label: "Smoker" },
  { value: "extreme-sports", label: "Extreme sports" },
  { value: "preexisting-condition", label: "Pre-existing condition" },
  { value: "high-risk-region", label: "High-risk region" },
];

export const QuotesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [riskSelection, setRiskSelection] = useState<string[]>([]);
  const [quoteResult, setQuoteResult] = useState<{ premium: number; currency: string } | null>(null);

  const form = useForm<QuoteInputForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { age: 30, coverageAmount: 50000, termMonths: 12 },
  });

  const quoteMutation = useMutation({
    mutationFn: calculateQuote,
    onSuccess: (data) => {
      setQuoteResult(data);
      showToast({ title: "Quote calculated", description: `Premium €${data.premium}`, variant: "success" });
    },
    onError: () => showToast({ title: "Quote failed", variant: "error" }),
  });

  const createPolicyMutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      showToast({ title: "Policy created", variant: "success" });
    },
    onError: () => showToast({ title: "Policy creation failed", variant: "error" }),
  });

  const toggleRisk = (value: string) => {
    setRiskSelection((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const onSubmit = form.handleSubmit((values) => {
    quoteMutation.mutate({
      age: values.age,
      coverageAmount: values.coverageAmount,
      riskFactors: riskSelection,
    });
  });

  const canCreatePolicy = quoteResult && user;

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader title="Premium calculator" description="Generate a quick quote based on applicant profile." />
        <CardContent>
          <form className={styles.form} onSubmit={onSubmit}>
            <FormField label="Applicant age" error={form.formState.errors.age?.message}>
              <Input type="number" min="18" max="100" {...form.register("age", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Coverage amount (€)" error={form.formState.errors.coverageAmount?.message}>
              <Input
                type="number"
                step="1000"
                min="0.01"
                {...form.register("coverageAmount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Term (months)" error={form.formState.errors.termMonths?.message}>
              <Input type="number" min="1" {...form.register("termMonths", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Risk factors">
              <div className={styles.riskChips}>
                {RISK_OPTIONS.map((risk) => (
                  <button
                    key={risk.value}
                    type="button"
                    className={clsx(styles.chip, riskSelection.includes(risk.value) && styles.chipActive)}
                    onClick={() => toggleRisk(risk.value)}
                  >
                    {risk.label}
                  </button>
                ))}
              </div>
            </FormField>
            <div>
              <Button type="submit" isLoading={quoteMutation.isPending}>
                Calculate premium
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Quote summary" description="Create a policy for the applicant from this quote." />
        <CardContent>
          {quoteResult ? (
            <div className={styles.resultCard}>
              <div>
                <h2 style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>
                  {formatCurrency(quoteResult.premium)}
                </h2>
                <p>Premium payable in {formatNumber(form.getValues("termMonths"))} monthly instalments.</p>
                <p>Risk factors: {riskSelection.length ? riskSelection.join(", ") : "None"}</p>
              </div>
              <Button
                onClick={() =>
                  canCreatePolicy &&
                  createPolicyMutation.mutate({
                    userId: user!.userId,
                    coverageAmount: form.getValues("coverageAmount"),
                    premium: quoteResult.premium,
                    termMonths: form.getValues("termMonths"),
                    quoteId: undefined,
                  })
                }
                disabled={!canCreatePolicy}
                isLoading={createPolicyMutation.isPending}
              >
                Create policy for {user?.username ?? "user"}
              </Button>
            </div>
          ) : (
            <p>Calculate a quote to display results here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
