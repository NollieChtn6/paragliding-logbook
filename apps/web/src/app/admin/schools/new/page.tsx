import { createSchoolAction } from "@/actions/create-school";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { SchoolForm } from "@/features/schools/school-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export default async function NewSchoolPage() {
  const t = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.schools.newSchool} actions={<LeaveFormButton href="/admin/schools" />} />
      <SchoolForm action={createSchoolAction} submitLabel={t.schools.createSchool} />
    </div>
  );
}
