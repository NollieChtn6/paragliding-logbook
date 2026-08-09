// Fonction pure, indépendante de React/Next.js — now en paramètre (plutôt
// que new Date() figé) pour rester testable et correct sur un process
// serveur longue durée (même principe que flightSchema, voir
// lib/validations/flight.ts).
export function getGreeting(name: string, now: Date = new Date()): string {
  const firstName = name.split(" ")[0];
  const greeting = now.getHours() < 19 ? "Bonjour" : "Bonsoir";
  return `${greeting} ${firstName} 👋`;
}
