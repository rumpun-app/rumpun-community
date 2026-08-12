"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, CardContent, Alert } from "@/components/ui";
import type { Source, SourcesPage } from "@/types/api";

export function SourcesList() {
  const [page, setPage] = useState<SourcesPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSources(cursor?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSources({ cursor });
      setPage(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in to view sources.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load sources");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  if (loading) return <p aria-live="polite">Loading sources&hellip;</p>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return page && page.items.length === 0 ? (
    <Card>
      <CardContent className="pt-6 text-center text-muted-foreground">
        No sources found.
      </CardContent>
    </Card>
  ) : page ? (
    <div className="flex flex-col gap-3" role="list" aria-label="Sources list">
      {page.items.map((source: Source) => (
        <Card key={source.id}>
          <CardContent className="pt-6">
            <h3 className="font-medium">{source.title}</h3>
            <p className="text-sm text-muted-foreground">{source.type}</p>
            {source.author ? (
              <p className="text-sm text-muted-foreground">By {source.author}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {page.nextCursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadSources(page.nextCursor!)} loading={loading}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  ) : null;
}
