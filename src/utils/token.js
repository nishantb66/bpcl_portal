// src/utils/token.js

"use client"; // Tells Next.js this file uses client-side React features

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // NOTE: next/navigation for the app directory

export default function useAuth() {
  const router = useRouter(); // This is the App Router's hook

  useEffect(() => {
    // Only run client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
      } else {
        const { exp } = JSON.parse(atob(token.split(".")[1]));
        if (Date.now() >= exp * 1000) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    }
  }, [router]);
}
