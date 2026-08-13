"use client";

import { signOutAction } from "@/actions/sign-out";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useT();

  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        {t.common.signOut}
      </Button>
    </form>
  );
}
