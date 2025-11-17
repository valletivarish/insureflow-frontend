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
import styles from "./Login.module.css";

const loginSchema = z.object({
  username: z.string().min(3, "Username required"),
  password: z.string().min(4, "Password required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await login(values.username, values.password);
      showToast({ title: "Welcome back", variant: "success" });
      // Navigate will be handled by RoleBasedRedirect in App.tsx
      navigate("/");
    } catch (err) {
      console.error(err);
      setApiError("Invalid credentials");
      showToast({ title: "Login failed", description: "Check your credentials and try again", variant: "error" });
    }
  });

  const fillDemoCredentials = (username: string, password: string) => {
    setValue("username", username);
    setValue("password", password);
    setApiError(null);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.sidebar}>
        <div>
          <h1>InsureFlow</h1>
          <p>Modern insurance operations platform for quotes, policies, and claims in one workspace.</p>
        </div>
        <div className={styles.demoSection}>
          <p className={styles.demoLabel}>Demo Accounts:</p>
          <div className={styles.demoButtons}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => fillDemoCredentials("user@insureflow.test", "userpass")}
            >
              <span className={styles.demoRole}>USER</span>
              <span className={styles.demoEmail}>user@insureflow.test</span>
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => fillDemoCredentials("admin@insureflow.test", "adminpass")}
            >
              <span className={styles.demoRole}>ADMIN</span>
              <span className={styles.demoEmail}>admin@insureflow.test</span>
            </button>
          </div>
          <p style={{ marginTop: "var(--space-md)", fontSize: "var(--font-sm)", opacity: 0.9 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#fff", textDecoration: "underline" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className={styles.content}>
        <form className={styles.form} onSubmit={onSubmit}>
          <Card>
            <CardHeader title="Sign in" description="Manage policies, claims, and documents easily." />
            <CardContent>
              <FormField label="Email" htmlFor="username" error={errors.username?.message}>
                <Input id="username" placeholder="you@insureflow.test" {...register("username")}
                />
              </FormField>
              <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                <div className={styles.passwordWrapper}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    {...register("password")}
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
                  By signing in you accept the demo terms.
                </span>
                <Button type="submit" isLoading={isSubmitting}>
                  Sign in
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};
