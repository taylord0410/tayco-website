import { workspaceNavigation } from './workspace-navigation';

export const guestSections = ['summary','financial_dashboard','projects','corporate_meetings','followups','plans','note','change','lead','proposal','vendor','bid','hours','purchase_order','team','compliance','finance','invoice','dossier','estimates','takeoff','activity','access'] as const;
export type GuestSection = typeof guestSections[number];
export function isGuestSection(value: unknown): value is GuestSection { return typeof value === 'string' && (guestSections as readonly string[]).includes(value); }
const aliases: Record<string, GuestSection> = { executive:'summary', project:'projects', document:'plans', estimate:'estimates' };
/** Reuse the complete administrator menu catalog, never its actor or data privileges. */
export const guestModuleDefinitions = [
  ...workspaceNavigation('guest').map(item => ({...item, id: (aliases[item.id] ?? item.id) as GuestSection})),
  { id:'access' as const, label:'B2B access & invitations', group:'Connections' },
];
