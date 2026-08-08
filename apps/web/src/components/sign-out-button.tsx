import { signOutAction } from "@/actions/sign-out";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        Se déconnecter
      </Button>
    </form>
  );
}
