import { createFlightAction } from "@/actions/create-flight";
import { PageHeader } from "@/components/layout/page-header";
import { LeaveFormButton } from "@/components/leave-form-button";
import { getActivityById } from "@/features/activities";
import { FlightForm } from "@/features/flights/flight-form";
import { listTrainingCamps } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

// Les stages proposés doivent toujours refléter l'état actuel de la base,
// pas un instantané figé au build.
export const dynamic = "force-dynamic";

export default async function NewFlightPage(props: PageProps<"/flights/new">) {
  const user = await requireCurrentUser();
  const searchParams = await props.searchParams;
  const duplicateFromId = typeof searchParams.from === "string" ? searchParams.from : undefined;

  const [flightTypes, trainingCamps, duplicateSource] = await Promise.all([
    prisma.flightType.findMany({ select: { id: true, code: true } }),
    listTrainingCamps(user.id),
    // getActivityById vérifie déjà l'appartenance (findFirst id+userId) :
    // un id invalide ou appartenant à un autre utilisateur retombe
    // silencieusement sur un formulaire vierge, jamais une erreur — dupliquer
    // n'est qu'un raccourci de pré-remplissage, pas une opération sensible.
    duplicateFromId ? getActivityById(duplicateFromId, user.id) : Promise.resolve(null),
  ]);
  const t = getDictionary(await getLocale());

  // Seuls site de décollage/atterrissage et type de vol sont repris : la
  // date (aujourd'hui, comme toute création), la durée, les observations et
  // le stage associé restent vierges — un vol dupliqué reste un nouveau
  // vol, pas une copie de la narration d'un autre.
  const duplicateFlight = duplicateSource?.flight;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.flights.newFlight} actions={<LeaveFormButton />} />
      <FlightForm
        flightTypes={flightTypes}
        trainingCamps={trainingCamps}
        action={createFlightAction}
        defaultTakeoffPoint={duplicateFlight?.takeoffPoint}
        defaultLandingPoint={duplicateFlight?.landingPoint}
        defaultValues={duplicateFlight ? { flightTypeId: duplicateFlight.flightTypeId } : undefined}
      />
    </div>
  );
}
