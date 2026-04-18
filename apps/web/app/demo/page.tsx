"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/demoSession";

export default function DemoIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/demo/login");
      return;
    }
    router.replace(s.role === "patient" ? "/demo/patient" : "/demo/supporter");
  }, [router]);

  return null;
}
