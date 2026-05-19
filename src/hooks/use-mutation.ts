"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UseMutationOptions = {
  url: string;
  method?: "POST" | "PUT" | "DELETE";
  onSuccess?: () => void;
};

export function useMutation<T>({ url, method = "POST", onSuccess }: UseMutationOptions) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mutate(data: T) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      onSuccess?.();
      router.refresh();
      return json.data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { mutate, isLoading, error };
}
