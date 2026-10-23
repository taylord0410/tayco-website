import type { AuthRole } from './auth';

export type WorkspaceNavigationItem = { id: string; label: string; group: string };
/** Navigation metadata only. This function grants no data access or administrative authority. */
export function workspaceNavigation(role: AuthRole): WorkspaceNavigationItem[] {
  const fullMenu = role === 'admin' || role === 'staff' || role === 'guest', vendor = role === 'vendor';
  return [
    {id:"executive",label:"Executive overview",group:"Command center"},
    ...(fullMenu?[{id:"financial_dashboard",label:"Financial dashboard",group:"Command center"}]:[]),
    {id:"project",label:"Projects",group:"Command center"},
    ...(fullMenu?[{id:"corporate_meetings",label:"Corporate meetings",group:"Command center"},{id:"followups",label:"Follow-ups & priorities",group:"Command center"}]:[]),
    {id:"document",label:"Documents",group:"Command center"},
    {id:"note",label:"Updates",group:"Command center"},
    ...(!vendor?[{id:"change",label:"Changes",group:"Command center"}]:[]),
    ...(fullMenu?[{id:"lead",label:"Requests",group:"Commercial"},{id:"proposal",label:"Client proposals",group:"Commercial"},{id:"vendor",label:"Trade partners",group:"Commercial"}]:[]),
    ...(vendor?[{id:"vendor",label:"My company",group:"Commercial"}]:[]),
    ...(fullMenu||vendor?[{id:"bid",label:"Bid leveling",group:"Commercial"}]:[]),
    ...(fullMenu||vendor?[{id:"hours",label:"Team hours",group:"Field & procurement"},{id:"purchase_order",label:"Purchase orders",group:"Field & procurement"}]:[]),
    ...(fullMenu?[{id:"team",label:"Project teams",group:"Field & procurement"},{id:"compliance",label:"Project requirements & certifications",group:"Field & procurement"}]:[]),
    {id:"finance",label:"Financial overview",group:"Accounting & capital"},
    {id:"invoice",label:"Invoices",group:"Accounting & capital"},
    ...(!vendor?[{id:"dossier",label:"Investor & lender dossier",group:"Accounting & capital"}]:[]),
    ...(fullMenu?[{id:"estimate",label:"Estimates & scenarios",group:"Preconstruction"}]:[]),
    ...(fullMenu?[{id:"takeoff",label:"Takeoff Pro bridge",group:"Connections"},{id:"activity",label:"Activity",group:"Connections"}]:[]),
  ];
}
