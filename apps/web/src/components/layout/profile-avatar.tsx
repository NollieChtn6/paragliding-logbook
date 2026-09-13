import { cn } from "@/lib/utils";

export type ProfileSummary = {
  name: string;
  email: string;
  city?: string | null;
};

// Avatar textuel (initiales, dégradé primary→accent — même palette que le
// badge de marque de DesktopSidebar) : pas d'upload d'avatar dans le
// périmètre actuel (hors backlog), User.image n'est pas exploité ici.
export function ProfileAvatar({ user, className }: { user: ProfileSummary; className?: string }) {
  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-medium text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
