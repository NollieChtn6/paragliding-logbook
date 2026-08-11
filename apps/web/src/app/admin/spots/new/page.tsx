import { createSpotAction } from "@/actions/create-spot";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SpotForm } from "@/features/spots/spot-form";

export default function NewSpotPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau spot" actions={<LeaveFormButton href="/admin/spots" />} />
      <SpotForm action={createSpotAction} submitLabel="Créer le spot" />
    </div>
  );
}
