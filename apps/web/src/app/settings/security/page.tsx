import { PageHeader } from "@/components/layout/page-header";
import { InstallSettingsCard } from "@/components/pwa/install-settings-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/account/change-password-form";
import { ProfileForm } from "@/features/account/profile-form";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// Titre/URL "Sécurité" conservés (seule page de /settings existante, tous
// les liens de nav pointent déjà vers /settings/security) même si la page
// couvre désormais aussi le profil : ajouter une vraie sous-navigation pour
// une seule carte de plus serait disproportionné.
export default async function SecuritySettingsPage() {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale()).account;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.pageTitle} description={t.pageDescription} />

      {/* Avant Profil/Sécurité (pas après) : sur mobile, visible sans
      défiler — utile pour montrer rapidement le QR code à quelqu'un depuis
      son téléphone, le but même de cette carte. */}
      <InstallSettingsCard />

      {/* Côte à côte à partir de md : les deux formulaires sont courts et
      indépendants, pas besoin de forcer un défilement vertical sur desktop.
      Empilés sur mobile (flex-col par défaut). */}
      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="md:flex-1">
          <CardHeader>
            <CardTitle>{t.profileCardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} city={user.city} />
          </CardContent>
        </Card>

        <Card className="md:flex-1">
          <CardHeader>
            <CardTitle>{t.securityCardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm email={user.email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
