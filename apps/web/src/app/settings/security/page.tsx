import { PageHeader } from "@/components/layout/page-header";
import { InstallSettingsCard } from "@/components/pwa/install-settings-card";
import { AccountOverview } from "@/features/account/account-overview";
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

      {/* Avant le bandeau d'identité/onglets (pas après) : sur mobile,
      visible sans défiler — utile pour montrer rapidement le QR code à
      quelqu'un depuis son téléphone, le but même de cette carte. */}
      <InstallSettingsCard />

      <AccountOverview user={user} />
    </div>
  );
}
