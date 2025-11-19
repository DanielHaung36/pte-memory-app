"use client";

import { ReduxProvider } from "@/providers/ReduxProvider";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { GameProvider } from "@/contexts/GameContext";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { SmartAlertContainer } from "@/components/ui/SmartAlert";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 这些页面不需要认证保护
  const publicRoutes = ['/auth/login', '/auth/register', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  return (
    <ReduxProvider>
      <ReviewProvider>
        <GameProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ProtectedRoute requireAuth={!isPublicRoute}>
              <AnimatePresence mode="wait" initial={false}>
                {children}
              </AnimatePresence>
              <SmartAlertContainer />
            </ProtectedRoute>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                className: "font-medium",
                style: {
                  background: "#fff",
                  color: "#1f2937",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                },
                success: {
                  style: {
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                  },
                },
                error: {
                  style: {
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                  },
                },
              }}
            />
          </ThemeProvider>
        </GameProvider>
      </ReviewProvider>
    </ReduxProvider>
  );
}
