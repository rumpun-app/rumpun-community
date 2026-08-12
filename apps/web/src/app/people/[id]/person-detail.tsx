"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, CardContent, Badge, Alert, Input } from "@/components/ui";
import type { Person, Relationship, RelationshipsPage, Fact, PersonName } from "@/types/api";
import Link from "next/link";

interface PersonDetailProps {
  personId: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  biological_parent: "Biological parent",
  adoptive_parent: "Adoptive parent",
  foster_parent: "Foster parent",
  guardian: "Guardian",
  spouse: "Spouse",
  partner: "Partner",
  step_parent: "Step parent",
  sibling: "Sibling",
  custom: "Custom",
};

const FACT_LABELS: Record<string, string> = {
  birth: "Birth",
  death: "Death",
  burial: "Burial",
  marriage: "Marriage",
  divorce: "Divorce",
  residence: "Residence",
  occupation: "Occupation",
  education: "Education",
  nationality: "Nationality",
  religion: "Religion",
  custom: "Custom",
};

export function PersonDetail({ personId }: PersonDetailProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [personData, relsData] = await Promise.all([
        api.getPerson(personId),
        api.listRelationships(personId),
      ]);
      setPerson(personData);
      setRelationships(relsData.items);
      setEditNotes(personData.notes ?? "");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("Person not found.");
      } else if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load person");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [personId]);

  const handleSaveNotes = async () => {
    if (!person) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.updatePerson(
        personId,
        { notes: editNotes || null },
        person.version,
      );
      setPerson(updated);
      setEditing(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 412) {
        setSaveError("Modified by another session. Please refresh.");
      } else {
        setSaveError(e instanceof Error ? e.message : "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!person) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await api.deletePerson(personId, person.version);
      window.location.href = "/people";
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p aria-live="polite">Loading person&hellip;</p>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!person) return null;

  const preferredName = person.names.find((n) => n.preferred) ?? person.names[0];

  return (
    <div className="flex flex-col gap-6">
      {saveError ? (
        <Alert variant="error">{saveError}</Alert>
      ) : null}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {preferredName?.display ?? "Unknown"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={person.livingStatus === "deceased" ? "default" : "outline"}>
              {person.livingStatus === "deceased" ? "Deceased" : person.livingStatus === "living" ? "Living" : "Unknown"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {person.sex ? person.sex.replace("_", " ") : "Not recorded"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit notes"}
          </Button>
          {deleteConfirm ? (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleting}>
                Confirm delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Names */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Names</h2>
          <div className="flex flex-col gap-2">
            {person.names.map((name: PersonName) => (
              <div key={name.id} className="flex items-center gap-2">
                <span className="font-medium">{name.display}</span>
                <span className="text-xs text-muted-foreground">{name.type}</span>
                {name.preferred ? <Badge variant="outline">Preferred</Badge> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facts */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Facts</h2>
          {person.facts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No facts recorded.</p>
          ) : (
            <div className="flex flex-col gap-3" role="list" aria-label="Facts">
              {person.facts.map((fact: Fact) => (
                <div key={fact.id} className="rounded border p-3" role="listitem">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {FACT_LABELS[fact.type] ?? fact.type}
                      {fact.customType ? ` (${fact.customType})` : ""}
                    </span>
                    <Badge variant={fact.confidence === "high" ? "success" : fact.confidence === "disputed" ? "warning" : "outline"}>
                      {fact.confidence}
                    </Badge>
                  </div>
                  {fact.value ? <p className="mt-1 text-sm">{fact.value}</p> : null}
                  {fact.date ? (
                    <p className="mt-1 text-xs text-muted-foreground">{fact.date.originalText}</p>
                  ) : null}
                  {fact.place ? (
                    <p className="text-xs text-muted-foreground">{fact.place}</p>
                  ) : null}
                  {fact.citations.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fact.citations.length} citation{fact.citations.length !== 1 ? "s" : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Relationships</h2>
            <Link href={`/relationships?personId=${personId}`} className="text-sm underline text-muted-foreground hover:text-foreground">
              Manage
            </Link>
          </div>
          {relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No relationships recorded.</p>
          ) : (
            <div className="flex flex-col gap-2" role="list" aria-label="Relationships">
              {relationships.map((rel: Relationship) => (
                <div key={rel.id} className="rounded border p-3" role="listitem">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {RELATIONSHIP_LABELS[rel.type] ?? rel.type}
                    </span>
                    <Badge variant={rel.confidence === "high" ? "success" : "outline"}>
                      {rel.confidence}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    <Link href={`/people/${rel.fromPersonId === personId ? rel.toPersonId : rel.fromPersonId}`} className="underline">
                      {rel.fromPersonId === personId ? "To" : "From"} another person
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</h2>
          {editing ? (
            <div className="flex flex-col gap-3">
              <textarea
                id="person-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                maxLength={10000}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Notes"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} loading={saving} size="sm">Save</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditNotes(person.notes ?? ""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {person.notes || "No notes."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Created: {new Date(person.createdAt).toLocaleString()} &middot;
        Updated: {new Date(person.updatedAt).toLocaleString()} &middot;
        Version: {person.version}
      </div>
    </div>
  );
}
