import { createSpotAction } from "@/actions/create-spot";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SpotForm } from "@/features/spots/spot-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export default async function NewSpotPage() {
  const t = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.spots.newSpot} actions={<LeaveFormButton href="/admin/spots" />} />
      <SpotForm action={createSpotAction} submitLabel={t.spots.createSpot} />
    </div>
  );
}
