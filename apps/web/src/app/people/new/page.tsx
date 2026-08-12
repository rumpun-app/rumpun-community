import { AppShell } from "@/components/features/app-shell";
import { CreatePersonForm } from "./create-person-form";

export default function NewPersonPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">Add Person</h1>
        <CreatePersonForm />
      </div>
    </AppShell>
  );
}
