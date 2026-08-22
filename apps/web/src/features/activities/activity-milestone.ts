export type ActivityMilestone = { kind: "first-activity" };

// Fonction pure, même principe que dashboard-stats.ts : le tout premier
// vol/stage/gonflage d'un utilisateur mérite d'être distingué d'une
// sauvegarde de routine ("Vol créé.") — c'est le début du carnet, pas juste
// une ligne de plus. Ne dépend d'aucun type d'activité en particulier :
// s'applique quel que soit le type créé en premier.
export function getActivityMilestone(previousActivityCount: number): ActivityMilestone | null {
  return previousActivityCount === 0 ? { kind: "first-activity" } : null;
}
