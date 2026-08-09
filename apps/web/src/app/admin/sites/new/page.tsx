import { createSiteAction } from "@/actions/create-site";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SiteForm } from "@/features/sites/site-form";

export default function NewSitePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouveau site" actions={<LeaveFormButton href="/admin/sites" />} />
      <SiteForm action={createSiteAction} submitLabel="Créer le site" />
    </div>
  );
}
