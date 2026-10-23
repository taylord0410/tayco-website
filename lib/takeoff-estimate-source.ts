import { createHash } from 'node:crypto';
import { parseProjectEstimate, type ProjectEstimate } from './project-estimates';

export type EstimateSource = { reference: string; bytes: Buffer };
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
function object(value: unknown): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Invalid Takeoff source record.');
 return value as Record<string, unknown>;
}
function sourceTimestamp(value: unknown): string | null {
 if (typeof value !== 'string') return null;
 const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/.test(value) ? value.replace(' ', 'T').replace(' UTC', ':00Z') : value;
 return Number.isFinite(Date.parse(normalized)) ? normalized : null;
}
function decode(text: string) {
 return text.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
  const named: Record<string,string> = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
  if(named[entity.toLowerCase()])return named[entity.toLowerCase()];
  const n=entity[2]?.toLowerCase()==='x'?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
  return Number.isInteger(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):'';
 }).trim();
}

/** Parse inert source bytes, never execute the report's scripts or contact Takeoff. */
export function takeoffEstimateSnapshots(input: {projectId:string;projectSlug:string;projectName?:string;scenario:EstimateSource;report:EstimateSource;apu?:EstimateSource;capturedAt:string}): ProjectEstimate[] {
 if(!/^[a-z0-9_]{1,100}$/.test(input.projectSlug))throw new TypeError('Invalid Takeoff project reference.');
 for(const file of [input.scenario,input.report,...(input.apu?[input.apu]:[])])if(file.bytes.length>10*1024*1024)throw new TypeError('Estimate source exceeds the supported size.');
 const scenario=object(JSON.parse(input.scenario.bytes.toString('utf8'))),html=input.report.bytes.toString('utf8');
 const script=html.match(/<script\b[^>]*\bid=["']report-json-data["'][^>]*>([\s\S]*?)<\/script>/i);
 if(!script)throw new TypeError('The Takeoff report has no structured estimate payload.');
 const report=object(JSON.parse(script[1])),financial=object(report.financial_summary);
 if(scenario.schema!=='takeoff_active_scenario.v1'||scenario.project_id!==input.projectSlug||report.project_id!==input.projectSlug||financial.currency!=='USD')throw new TypeError('Estimate source project, currency or schema does not match.');
 const projectName=input.projectName||String(report.project_name||input.projectSlug);
 const common={projectId:input.projectId,projectName,sourceProjectSlug:input.projectSlug,status:'estimate',currency:'USD',capturedAt:input.capturedAt,sourceAvailability:'archived',breakdownBasis:'direct_cost',rawCostLineCount:null};
 const scenarioDate=sourceTimestamp(scenario.updated_at);
 const scenarioEstimate=parseProjectEstimate({...common,id:'scenario-'+digest(input.scenario.bytes).slice(0,40),version:'Active scenario · '+String(scenario.updated_at||'undated'),estimatedOn:scenarioDate,dateBasis:scenarioDate?'source_snapshot':'unknown',amountUsd:scenario.active_total_bid_usd??null,directCostUsd:scenario.active_direct_cost_usd??null,sourceName:'Takeoff Pro · active scenario snapshot',sourceRef:input.scenario.reference,sourceSha256:digest(input.scenario.bytes),breakdown:[],breakdownReconciled:false,sourceFacts:['Recovered estimate snapshot; no signed contract, executed cost or payment is inferred.','Scenario parameters and source byte digest are retained in the private archive.']});
 const table=html.match(/<table\b[^>]*\bid=["']csi-summary-table["'][^>]*>([\s\S]*?)<\/table>/i);
 const breakdown:ProjectEstimate['breakdown']=[];
 for(const row of (table?.[1]||'').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match=>decode(match[1]));
  if(cells.length<6||!/^CSI\s+/i.test(cells[0]))continue;
  const monetary=cells[5].replace(/^\$\s*/, '').trim();
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(monetary))throw new TypeError('A CSI amount is missing or malformed.');
  const amountUsd=Number(monetary.replaceAll(',',''));
  breakdown.push({code:cells[0],label:cells[1],amountUsd});
 }
 const reportDate=sourceTimestamp(report.generated_at),direct=financial.direct_cost_usd;
 const reconciled=breakdown.length>0&&typeof direct==='number'&&breakdown.reduce((sum,row)=>sum+Math.round(row.amountUsd*100),0)===Math.round(direct*100);
 const reportEstimate=parseProjectEstimate({...common,id:'boq-'+digest(input.report.bytes).slice(0,40),version:'BOQ CSI export · '+String(report.generated_at||'undated'),estimatedOn:reportDate,dateBasis:reportDate?'source_snapshot':'unknown',amountUsd:financial.grand_total_bid_usd??null,directCostUsd:direct??null,sourceName:'Takeoff Pro · BOQ CSI export',sourceRef:input.report.reference,sourceSha256:digest(input.report.bytes),breakdown,breakdownReconciled:reconciled,sourceFacts:['Independent exported BOQ revision; comparison with the scenario is required before choosing a contractual baseline.','CSI values come from the report table; no execution progress or bank settlement is inferred.']});
 if(scenarioEstimate.amountUsd!==reportEstimate.amountUsd){
  for(const estimate of [scenarioEstimate,reportEstimate])estimate.sourceFacts.push('The recovered scenario and BOQ totals differ. These are separate estimate revisions, not a combined total or an automatic approved budget.');
 }
 const estimates=[scenarioEstimate,reportEstimate];
 if(input.apu){
  const payload=object(JSON.parse(input.apu.bytes.toString('utf8'))),apu=object(payload.apu_breakdown);
  if(payload.schema!=='takeoff_apu_procurement.v1'||payload.project_id!==input.projectSlug||apu.project_id!==input.projectSlug||apu.status!=='ok'||!Array.isArray(apu.apu_items))throw new TypeError('APU source project, schema or availability does not match.');
  const items=apu.apu_items.map(object),rows=items.map(row=>({code:String(row.csi_code||''),label:String(row.csi_division||''),amountUsd:row.subtotal_usd}));
  const tiers=[{code:'materials',label:'Materials',amountUsd:apu.total_materials_usd},{code:'labor',label:'Labor',amountUsd:apu.total_labor_usd},{code:'equipment',label:'Equipment',amountUsd:apu.total_equipment_usd}];
  const sourceDate=sourceTimestamp(payload.updated_at),direct=apu.total_direct_cost_usd;
  const equal=(values:unknown[])=>typeof direct==='number'&&values.every(value=>typeof value==='number'&&Number.isFinite(value))&&values.reduce<number>((sum,value)=>sum+Math.round((value as number)*100),0)===Math.round(direct*100);
  const facts=['Recovered APU estimate with its own source revision. Costs, labor and crew information are estimating inputs, not actual execution or paid payroll.'];
  if(typeof apu.total_man_hours==='number')facts.push('Estimated labor hours in source: '+apu.total_man_hours+'.');
  if(typeof apu.total_crew_days==='number')facts.push('Estimated crew days in source: '+apu.total_crew_days+'.');
  for(const row of items){
   const detail=[row.csi_code,typeof row.man_hours_total==='number'?'Estimated labor '+row.man_hours_total+' hours':null,typeof row.crew_composition==='string'?row.crew_composition:null,typeof row.sheet_ref==='string'?'Sheets '+row.sheet_ref:null].filter(Boolean).join(' · ');
   if(detail)facts.push(detail);
  }
  const apuEstimate=parseProjectEstimate({...common,id:'apu-'+digest(input.apu.bytes).slice(0,40),version:'APU cost packages · '+String(payload.updated_at||'undated'),estimatedOn:sourceDate,dateBasis:sourceDate?'source_snapshot':'unknown',amountUsd:apu.total_bid_cost_usd??null,directCostUsd:direct??null,sourceName:'Takeoff Pro · APU cost packages',sourceRef:input.apu.reference,sourceSha256:digest(input.apu.bytes),breakdown:rows,breakdownReconciled:rows.length>0&&equal(rows.map(row=>row.amountUsd)),costTiers:tiers,costTiersReconciled:equal(tiers.map(row=>row.amountUsd)),sourceFacts:facts});
  if(apuEstimate.amountUsd!==scenarioEstimate.amountUsd)apuEstimate.sourceFacts.push('The APU and active scenario totals differ. Review their source versions before selecting a baseline.');
  estimates.push(apuEstimate);
 }
 return estimates;
}
