import { createSchoolAction } from "@/actions/create-school";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SchoolForm } from "@/features/schools/school-form";

export default function NewSchoolPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nouvelle école" actions={<LeaveFormButton href="/admin/schools" />} />
      <SchoolForm action={createSchoolAction} submitLabel="Créer l'école" />
    </div>
  );
}
