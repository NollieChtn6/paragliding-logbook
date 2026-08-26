import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export default async function EquipmentNotFound() {
  const t = getDictionary(await getLocale()).equipment;

  return (
    <EmptyState
      icon={SearchX}
      title={t.notFoundTitle}
      description={t.notFoundDescription}
      action={
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/equipment">{t.backToEquipment}</Link>}
        />
      }
    />
  );
}
