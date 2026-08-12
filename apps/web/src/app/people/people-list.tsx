"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, CardContent, Input, Badge, Alert } from "@/components/ui";
import type { Person, PeoplePage } from "@/types/api";
import Link from "next/link";

export function PeopleList() {
  const [page, setPage] = useState<PeoplePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadPeople = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPeople({ cursor, query: query || undefined });
      setPage(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in to view people.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load people");
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPeople();
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            label="Search"
            id="people-search"
            placeholder="Search by name&hellip;"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" className="mt-6">
          Search
        </Button>
        <Link
          href="/people/new"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Add person
        </Link>
      </form>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {loading ? (
        <p aria-live="polite">Loading people&hellip;</p>
      ) : page && page.items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No people found.{" "}
            <Link href="/people/new" className="underline">Add the first person</Link>.
          </CardContent>
        </Card>
      ) : page ? (
        <>
          <div className="grid gap-3" role="list" aria-label="People list">
            {page.items.map((person: Person) => (
              <Link key={person.id} href={`/people/${person.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="font-medium">
                        {person.names.find((n) => n.preferred)?.display ?? person.names[0]?.display ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {person.livingStatus === "deceased" ? "Deceased" : person.livingStatus === "living" ? "Living" : "Status unknown"}
                      </p>
                    </div>
                    <Badge variant={person.livingStatus === "deceased" ? "default" : "outline"}>
                      {person.livingStatus}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {page.nextCursor ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadPeople(page.nextCursor!)}
                loading={loading}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
