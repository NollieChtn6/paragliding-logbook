import { notFound } from "next/navigation";
import { deleteSchoolAction } from "@/actions/delete-school";
import { updateSchoolAction } from "@/actions/update-school";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getSchool } from "@/features/schools";
import { SchoolForm } from "@/features/schools/school-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export const dynamic = "force-dynamic";

export default async function EditSchoolPage(props: PageProps<"/admin/schools/[id]/edit">) {
  const { id } = await props.params;
  const school = await getSchool(id);

  if (!school) {
    notFound();
  }

  const t = getDictionary(await getLocale());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t.schools.modifyTitle(school.name)}
        actions={
          <>
            <LeaveFormButton
              href="/admin/schools"
              title={t.common.discardChangesTitle}
              description={t.common.discardChangesDescription}
            />
            <AdminDeleteButton
              action={deleteSchoolAction.bind(null, school.id)}
              entityLabel={t.schools.entityLabel(school.name)}
            />
          </>
        }
      />

      <SchoolForm
        action={updateSchoolAction.bind(null, school.id)}
        submitLabel={t.schools.editSchool}
        defaultValues={{
          name: school.name,
          address: school.address ?? undefined,
          postalCode: school.postalCode ?? undefined,
          city: school.city ?? undefined,
          countryCode: school.countryCode ?? undefined,
          latitude: school.latitude ?? undefined,
          longitude: school.longitude ?? undefined,
          website: school.website ?? undefined,
        }}
      />
    </div>
  );
}
