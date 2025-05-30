"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../lib/apiService";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      // Check if the token is valid
      try {
        const token = authService.getToken();
        if (token) {
          await authService.validateToken(token);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Invalid token:", error);
        authService.logout();
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
