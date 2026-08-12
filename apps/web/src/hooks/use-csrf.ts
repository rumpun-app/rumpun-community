"use client";

import { useCallback, useRef } from "react";
import { api } from "@/lib/api-client";

export function useCsrf() {
  const tokenRef = useRef<string | null>(null);
  const expiresRef = useRef<number>(0);

  const getToken = useCallback(async (): Promise<string> => {
    if (tokenRef.current && Date.now() < expiresRef.current) {
      return tokenRef.current;
    }
    const csrf = await api.getCsrfToken();
    tokenRef.current = csrf.token;
    expiresRef.current = new Date(csrf.expiresAt).getTime() - 5000;
    return csrf.token;
  }, []);

  return { getCsrfToken: getToken };
}
