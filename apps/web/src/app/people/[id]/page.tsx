import { AppShell } from "@/components/features/app-shell";
import { PersonDetail } from "./person-detail";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <PersonDetail personId={id} />
    </AppShell>
  );
}
