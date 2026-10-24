import { parseReviewInteraction,type ReviewInteractionElement,type ReviewInteractionInput } from './review-interaction-contract';
export type InteractionAck={status:number;body?:unknown};
type Entry={payload:ReviewInteractionInput;created:number;due:number;attempts:number};
type Attempt={id:string;controller:AbortController;started:number};
export type InteractionQueueOptions={
 permitted:()=>boolean;remainingMs:()=>number;send:(input:ReviewInteractionInput,signal:AbortSignal)=>Promise<InteractionAck>;
 now?:()=>number;uuid?:()=>string;schedule?:(run:()=>void,delay:number)=>unknown;cancel?:(handle:unknown)=>void;
};
/** Memory-only, bounded and best effort. An accepted enqueue is not an acknowledged event.
 * At most20pending,3attempts,30seconds; no persisted browser queue or tracking cookie. */
export function createReviewInteractionQueue(options:InteractionQueueOptions){
 const now=options.now??(()=>performance.now()),uuid=options.uuid??(()=>crypto.randomUUID());
 const schedule=options.schedule??((run,delay)=>setTimeout(run,delay)),cancel=options.cancel??(handle=>clearTimeout(handle as ReturnType<typeof setTimeout>));
 const entries=new Map<string,Entry>();let active:Attempt|undefined,timer:unknown,closed=false,denied=false;
 function clear(){
  if(timer!==undefined){cancel(timer);timer=undefined;}
  const prior=active;active=undefined;entries.clear();prior?.controller.abort();
 }
 function allowed(){return !closed&&!denied&&options.permitted()&&options.remainingMs()>0;}
 function arm(delay:number){
  if(timer!==undefined)cancel(timer);
  if(!entries.size||!allowed()){clear();return;}
  const oldest=Math.min(...[...entries.values()].map(x=>x.created+30000-now()));
  timer=schedule(()=>{timer=undefined;pump();},Math.max(0,Math.min(delay,oldest,options.remainingMs())));
 }
 function retry(entry:Entry){
  if(entry.attempts>=3)entries.delete(entry.payload.eventId);
  else entry.due=now()+(entry.attempts===1?1000:3000);
 }
 function settled(attempt:Attempt,response:InteractionAck){
  if(active!==attempt)return;
  active=undefined;if(!allowed()){clear();return;}
  const entry=entries.get(attempt.id);if(!entry){pump();return;}
  const body=response.body as Record<string,unknown>|undefined;
  const ack=response.status>=200&&response.status<300&&body&&typeof body==='object'&&!Array.isArray(body)&&body.success===true&&body.taxonomyVersion===2&&body.eventId===attempt.id;
  if(ack)entries.delete(attempt.id);
  else if(response.status===401||response.status===403){denied=true;clear();return;}
  else if(response.status>=400&&response.status<500&&response.status!==429)entries.delete(attempt.id);
  else retry(entry);
  pump();
 }
 function pump(){
  if(!allowed()){clear();return;}
  const time=now();
  for(const[id,entry]of entries)if(time-entry.created>=30000){
   entries.delete(id);if(active?.id===id){const previous=active;active=undefined;previous.controller.abort();}
  }
  if(active){
   if(time-active.started>=8000){const previous=active;active=undefined;previous.controller.abort();const entry=entries.get(previous.id);if(entry)retry(entry);}
   else{arm(8000-(time-active.started));return;}
  }
  const candidates=[...entries.values()].sort((a,b)=>a.due-b.due),entry=candidates[0];
  if(!entry){clear();return;}
  if(entry.due>time){arm(entry.due-time);return;}
  entry.attempts++;
  const attempt:Attempt={id:entry.payload.eventId,controller:new AbortController(),started:time};active=attempt;
  // Promise.resolve also turns a synchronous transport exception into a bounded retry.
  void Promise.resolve().then(()=>{if(active!==attempt||!allowed())return {status:403};return options.send(entry.payload,attempt.controller.signal);})
   .then(response=>settled(attempt,response),()=>settled(attempt,{status:0}));
  arm(8000);
 }
 return{
  enqueue(elementId:ReviewInteractionElement,metadata:Omit<Partial<ReviewInteractionInput>,'elementId'|'eventId'|'taxonomyVersion'>={},eventId=uuid()):boolean{
   if(!allowed()){clear();return false;}
   if(Object.keys(metadata).some(k=>['elementId','eventId','taxonomyVersion'].includes(k)))return false;
   let payload:ReviewInteractionInput;
   try{payload=parseReviewInteraction({taxonomyVersion:2,eventId,elementId,...metadata});}catch{return false;}
   const existing=entries.get(payload.eventId);
   if(existing)return JSON.stringify(existing.payload)===JSON.stringify(payload);
   if(entries.size>=20)return false;
   entries.set(payload.eventId,{payload,created:now(),due:now(),attempts:0});pump();return true;
  },
  clear,dispose(){closed=true;clear();},pending(){return entries.size;},
 };
}
