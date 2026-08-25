"use client";

import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/components/locale-provider";
import { useMounted } from "@/lib/use-mounted";

// Encode l'origine courante (window.location.origin), pas une URL en dur :
// reste correct automatiquement en preview/prod sans variable
// d'environnement à maintenir (docs/decisions/008). Fond blanc fixe
// (indépendant du thème) : un QR code a besoin d'un contraste fiable pour
// rester scannable, y compris en thème sombre.
export function InstallQrCode() {
  const mounted = useMounted();
  const t = useT();

  if (!mounted) {
    return null;
  }

  return (
    // Pas de border ici (critique dashboard, detector "nested-cards") :
    // ce swatch vit déjà à l'intérieur du Card d'InstallPrompt/
    // InstallSettingsCard, qui porte sa propre bordure — un second contour
    // imbriqué était redondant. Le fond blanc fixe (contraste QR) suffit à
    // distinguer le swatch du fond du Card.
    <div className="flex-none rounded-xl bg-white p-3">
      <QRCodeSVG
        value={window.location.origin}
        size={112}
        bgColor="#ffffff"
        fgColor="#2563eb"
        title={t.pwa.qrCodeTitle}
      />
    </div>
  );
}
