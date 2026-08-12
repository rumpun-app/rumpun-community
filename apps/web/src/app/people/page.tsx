import { AppShell } from "@/components/features/app-shell";
import { PeopleList } from "./people-list";

export default function PeoplePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
        </div>
        <PeopleList />
      </div>
    </AppShell>
  );
}
