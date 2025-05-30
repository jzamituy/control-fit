"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../../lib/apiService";

// Redirects already authenticated users
export default function AuthRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push("/expenses");
    }
  }, [router]);

  return <>{children}</>;
}
