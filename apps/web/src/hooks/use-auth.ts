"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { CurrentAccount } from "@/types/api";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; account: CurrentAccount }
  | { status: "error"; error: string };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const check = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const account = await api.getCurrentAccount();
      setState({ status: "authenticated", account });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState({ status: "unauthenticated" });
      } else {
        setState({
          status: "error",
          error: e instanceof Error ? e.message : "Failed to check auth",
        });
      }
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { state, check };
}
