import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, Camera, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/",          label: "Home",     icon: Home },
  { path: "/dashboard", label: "Controls", icon: LayoutDashboard },
  { path: "/camera",    label: "Camera",   icon: Camera },
  { path: "/data",      label: "Data",     icon: ChartSpline },
  { path: "/settings",  label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const isSplash = location.pathname === "/splash";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={`flex-1 overflow-y-auto ${isSplash ? "" : "pb-24"}`}>
        <Outlet />
      </main>

      {!isSplash && (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-card/85 backdrop-blur-2xl border-t border-border/40 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            <div className="max-w-lg mx-auto flex items-center justify-around">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-2xl transition-colors min-w-[56px]"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-2xl"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`relative z-10 h-5 w-5 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={`relative z-10 text-[10px] font-medium tracking-wide transition-colors ${
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
