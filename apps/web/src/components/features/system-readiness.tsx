"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Badge, Alert, Card, CardContent } from "@/components/ui";
import type { Readiness } from "@/types/api";

function statusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge variant="success">Ready</Badge>;
    case "degraded":
      return <Badge variant="warning">Degraded</Badge>;
    case "unavailable":
      return <Badge variant="error">Unavailable</Badge>;
    case "disabled":
      return <Badge variant="outline">Disabled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

export function SystemReadiness() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getReadiness();
        if (!cancelled) setReadiness(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "System unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p aria-live="polite">Checking system status&hellip;</p>;
  }

  if (error) {
    return <Alert variant="error" title="System unavailable">{error}</Alert>;
  }

  if (!readiness) return null;

  const deps = readiness.dependencies;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">System Status</h2>
          {statusBadge(readiness.status)}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Policy revision: <code className="text-xs">{readiness.policyRevision}</code>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="list" aria-label="Dependency status">
          <div className="flex items-center justify-between rounded border p-2" role="listitem">
            <span className="text-sm">PostgreSQL</span>
            {statusBadge(deps.postgresql)}
          </div>
          <div className="flex items-center justify-between rounded border p-2" role="listitem">
            <span className="text-sm">OPA</span>
            {statusBadge(deps.opa)}
          </div>
          <div className="flex items-center justify-between rounded border p-2" role="listitem">
            <span className="text-sm">Object Storage</span>
            {statusBadge(deps.objectStorage)}
          </div>
          <div className="flex items-center justify-between rounded border p-2" role="listitem">
            <span className="text-sm">Redis</span>
            {statusBadge(deps.redis)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
