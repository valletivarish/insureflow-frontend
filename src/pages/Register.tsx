import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { Input } from "../components/ui/Input";
import { EyeIcon, EyeOffIcon } from "../components/icons/Icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { register as registerUser } from "../api/services";
import styles from "./Login.module.css";

const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

          const onSubmit = handleSubmit(async (values) => {
            setApiError(null);
            try {
              await registerUser({
                email: values.email,
                password: values.password,
                role: "USER", // All UI registrations are USER role
              });

              // Automatically log in the user after registration
              await login(values.email, values.password);
      showToast({ title: "Account created successfully", variant: "success" });
      navigate("/");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.detail || "Registration failed";
      setApiError(errorMessage);
      showToast({ title: "Registration failed", description: errorMessage, variant: "error" });
    }
  });

  return (
    <div className={styles.screen}>
      <div className={styles.sidebar}>
        <div>
          <h1>InsureFlow</h1>
          <p>Create your account to start managing insurance policies and claims.</p>
        </div>
        <div className={styles.demoSection}>
          <p className={styles.demoLabel}>Already have an account?</p>
          <Link to="/login" style={{ color: "#fff", textDecoration: "underline" }}>
            Sign in instead
          </Link>
        </div>
      </div>
      <div className={styles.content}>
        <form className={styles.form} onSubmit={onSubmit}>
          <Card>
            <CardHeader title="Create account" description="Sign up to get started with InsureFlow." />
            <CardContent>
              <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerField("email")}
                />
              </FormField>
              <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                <div className={styles.passwordWrapper}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </FormField>
              {apiError && <p style={{ color: "var(--color-danger)", fontSize: "var(--font-sm)" }}>{apiError}</p>}
              <div className={styles.actions}>
                <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-xs)" }}>
                  By creating an account you accept the terms of service.
                </span>
                <Button type="submit" isLoading={isSubmitting}>
                  Create account
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

