import { renderToBuffer } from "@react-pdf/renderer";
import { CarnetPdfDocument } from "@/features/export/carnet-pdf-document";
import { getCarnetExportData } from "@/features/export/get-carnet-export-data.service";
import { getCurrentUser } from "@/lib/current-user";

// Le contenu dépend de la session et de l'état courant de la base à chaque
// requête : jamais de cache statique (même raisonnement que
// progression/page.tsx).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  // Pas de redirect (réservé aux pages, voir requireCurrentUser) : une route
  // d'API répond par un statut HTTP.
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const dateRange = from || to ? { from, to } : undefined;

  const data = await getCarnetExportData(user.id, dateRange);
  const pilotFirstName = user.name.split(" ")[0] ?? user.name;
  const buffer = await renderToBuffer(
    <CarnetPdfDocument
      data={data}
      pilotFirstName={pilotFirstName}
      editionDate={new Date()}
      dateRange={dateRange}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="carnet-progression.pdf"',
    },
  });
}
