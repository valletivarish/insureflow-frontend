import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "classnames";

import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { DashboardIcon, PoliciesIcon, ClaimsIcon, QuotesIcon, DocumentsIcon, AdminIcon, MenuIcon } from "../components/icons/Icons";
import styles from "./DashboardLayout.module.css";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  roles?: Array<"USER" | "ADMIN">;
}

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = useMemo(() => {
    if (!user) return [];
    
    const dashboardUrl = user.role === "ADMIN" ? "/admin" : `/user/${user.userId}`;
    
    const navItems: NavItem[] = [
      { label: "Dashboard", icon: <DashboardIcon />, to: dashboardUrl },
      { label: "Policies", icon: <PoliciesIcon />, to: "/policies" },
      { label: "Claims", icon: <ClaimsIcon />, to: "/claims" },
      { label: "Quotes", icon: <QuotesIcon />, to: "/quotes" },
      { label: "Documents", icon: <DocumentsIcon />, to: "/documents" },
      { label: "Admin Overview", icon: <AdminIcon />, to: "/admin/overview", roles: ["ADMIN"] },
    ];
    
    return navItems.filter((item) => !item.roles || item.roles.includes(user.role));
  }, [user]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.shell}>
      <aside className={clsx(styles.sidebar, sidebarOpen && styles.sidebarOpen)}>
        <div className={styles.brand}>InsureFlow</div>
        <nav className={styles.nav}>
          {items.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to.startsWith("/user/") && location.pathname.startsWith("/user/")) ||
              (item.to === "/admin" && location.pathname === "/admin") ||
              (item.to === "/admin/overview" && location.pathname === "/admin/overview");
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(styles.navLink, isActive && styles.navLinkActive)}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon} aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <Button className={styles.collapseButton} variant="ghost" onClick={() => setSidebarOpen((v) => !v)}>
            <MenuIcon />
          </Button>
          <Input className={styles.searchInput} placeholder="Search policies, claims, users" />
          <div className={styles.topbarActions}>
            {user && <span className={styles.userBadge}>{user.username} · {user.role}</span>}
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </header>
        <section className={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
};
