"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Select, Card, CardContent, Alert } from "@/components/ui";
import type { NameType, LivingStatus, PrivacyLevel, Person } from "@/types/api";

const NAME_TYPE_OPTIONS = [
  { value: "birth", label: "Birth name" },
  { value: "married", label: "Married name" },
  { value: "adopted", label: "Adopted name" },
  { value: "alias", label: "Alias" },
  { value: "religious", label: "Religious name" },
  { value: "transliterated", label: "Transliterated" },
  { value: "other", label: "Other" },
];

const LIVING_STATUS_OPTIONS = [
  { value: "living", label: "Living" },
  { value: "deceased", label: "Deceased" },
  { value: "unknown", label: "Unknown" },
];

const PRIVACY_OPTIONS = [
  { value: "members", label: "Members" },
  { value: "editors", label: "Editors" },
  { value: "administrators", label: "Administrators" },
];

const SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "intersex", label: "Intersex" },
  { value: "unknown", label: "Unknown" },
  { value: "not_recorded", label: "Not recorded" },
];

const FACT_TYPE_OPTIONS = [
  { value: "birth", label: "Birth" },
  { value: "death", label: "Death" },
  { value: "burial", label: "Burial" },
  { value: "marriage", label: "Marriage" },
  { value: "divorce", label: "Divorce" },
  { value: "residence", label: "Residence" },
  { value: "occupation", label: "Occupation" },
  { value: "education", label: "Education" },
  { value: "nationality", label: "Nationality" },
  { value: "religion", label: "Religion" },
  { value: "custom", label: "Custom" },
];

const CONFIDENCE_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "disputed", label: "Disputed" },
];

export function CreatePersonForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [nameDisplay, setNameDisplay] = useState("");
  const [nameType, setNameType] = useState<NameType>("birth");
  const [nameGiven, setNameGiven] = useState("");
  const [nameSurname, setNameSurname] = useState("");
  const [livingStatus, setLivingStatus] = useState<LivingStatus>("living");
  const [privacy, setPrivacy] = useState<PrivacyLevel>("members");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDisplay.trim()) {
      setError("A display name is required.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const person = await api.createPerson({
        names: [
          {
            type: nameType,
            display: nameDisplay,
            given: nameGiven || undefined,
            surname: nameSurname || undefined,
            preferred: true,
          },
        ],
        livingStatus,
        privacy,
        sex: sex ? (sex as Person["sex"]) : undefined,
        notes: notes || undefined,
      });
      router.push(`/people/${person.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.problem.detail ?? e.problem.title);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to create person");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error ? (
          <Alert variant="error" className="mb-4">{error}</Alert>
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <fieldset className="flex flex-col gap-4 rounded border p-4">
            <legend className="text-sm font-semibold">Name</legend>
            <Input
              label="Display name"
              value={nameDisplay}
              onChange={(e) => setNameDisplay(e.target.value)}
              required
              placeholder="e.g. Jane Elizabeth Smith"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Given name"
                value={nameGiven}
                onChange={(e) => setNameGiven(e.target.value)}
              />
              <Input
                label="Surname"
                value={nameSurname}
                onChange={(e) => setNameSurname(e.target.value)}
              />
            </div>
            <Select
              label="Name type"
              options={NAME_TYPE_OPTIONS}
              value={nameType}
              onChange={(e) => setNameType(e.target.value as NameType)}
            />
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Living status"
              options={LIVING_STATUS_OPTIONS}
              value={livingStatus}
              onChange={(e) => setLivingStatus(e.target.value as LivingStatus)}
            />
            <Select
              label="Privacy"
              options={PRIVACY_OPTIONS}
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PrivacyLevel)}
            />
          </div>

          <Select
            label="Sex (genealogical record)"
            options={SEX_OPTIONS}
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            placeholder="Select&hellip;"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="person-notes" className="text-sm font-medium">Notes</label>
            <textarea
              id="person-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={10000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <Button type="submit" loading={loading} className="mt-2">
            Create person
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
