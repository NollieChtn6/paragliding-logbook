"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMounted } from "@/lib/use-mounted";

// Encode l'origine courante (window.location.origin), pas une URL en dur :
// reste correct automatiquement en preview/prod sans variable
// d'environnement à maintenir (docs/decisions/008). Fond blanc fixe
// (indépendant du thème) : un QR code a besoin d'un contraste fiable pour
// rester scannable, y compris en thème sombre.
export function InstallQrCode() {
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex-none rounded-xl border border-border bg-white p-3">
      <QRCodeSVG
        value={window.location.origin}
        size={112}
        bgColor="#ffffff"
        fgColor="#2563eb"
        title="Scanner pour ouvrir THERMIK sur votre téléphone"
      />
    </div>
  );
}
