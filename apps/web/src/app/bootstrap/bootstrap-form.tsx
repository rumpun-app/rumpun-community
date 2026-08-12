"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Alert, Card, CardContent } from "@/components/ui";

export function BootstrapForm() {
  const router = useRouter();
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [treeName, setTreeName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ available: boolean; expiresAt: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const s = await api.getBootstrapStatus();
        if (!cancelled) setStatus(s);
      } catch {
        if (!cancelled) setStatus({ available: false, expiresAt: null });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (checking) {
    return <p aria-live="polite">Checking bootstrap status&hellip;</p>;
  }

  if (status && !status.available) {
    return (
      <Alert variant="info" title="Bootstrap unavailable">
        The first administrator has already been created. Bootstrap is no longer available.
      </Alert>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.createFirstAdministrator({
        bootstrapToken,
        email,
        password,
        displayName,
        treeName,
      });
      router.push("/tree");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.problem.detail ?? e.problem.title);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error ? (
          <Alert variant="error" title="Bootstrap failed" className="mb-4">
            {error}
          </Alert>
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Bootstrap token"
            type="password"
            value={bootstrapToken}
            onChange={(e) => setBootstrapToken(e.target.value)}
            required
            placeholder="Provided during deployment"
            autoComplete="off"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            autoComplete="new-password"
            hint="At least 12 characters"
          />
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            label="Tree name"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
            required
            placeholder="e.g. My Family Tree"
          />
          <Button type="submit" loading={loading} className="mt-2">
            Create administrator
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
