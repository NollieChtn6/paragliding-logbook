import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/account/change-password-form";
import { requireCurrentUser } from "@/lib/current-user";

export default async function SecuritySettingsPage() {
  const user = await requireCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sécurité" description="Changer votre mot de passe" />

      <Card className="max-w-sm">
        <CardContent>
          <ChangePasswordForm email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
