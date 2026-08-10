import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/account/change-password-form";
import { ProfileForm } from "@/features/account/profile-form";
import { requireCurrentUser } from "@/lib/current-user";

// Titre/URL "Sécurité" conservés (seule page de /settings existante, tous
// les liens de nav pointent déjà vers /settings/security) même si la page
// couvre désormais aussi le profil : ajouter une vraie sous-navigation pour
// une seule carte de plus serait disproportionné.
export default async function SecuritySettingsPage() {
  const user = await requireCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Compte" description="Gérer votre profil et votre sécurité" />

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} />
        </CardContent>
      </Card>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
