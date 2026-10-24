import {clearGuestAnalytics,installGuestPrivacyChoice,subscribeGuestPrivacy,guestAnalyticsAllowed,guestAnalyticsRemainingMs} from '../lib/guest-privacy-client';
import {GUEST_PRIVACY_VERSION} from '../lib/guest-privacy-contract';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createReviewInteractionQueue,type InteractionAck } from '../lib/review-interaction-queue';
import type { ReviewInteractionInput } from '../lib/review-interaction-contract';
async function flush(){for(let i=0;i<12;i++)await Promise.resolve();}
function harness(send:(input:ReviewInteractionInput,signal:AbortSignal)=>Promise<InteractionAck>){
 let time=0,enabled=true,expires=100000,seq=0;const tasks=new Map<number,{at:number;run:()=>void}>();
 const queue=createReviewInteractionQueue({now:()=>time,uuid:randomUUID,permitted:()=>enabled,remainingMs:()=>expires-time,send,
  schedule:(run,delay)=>{const id=++seq;tasks.set(id,{at:time+delay,run});return id;},cancel:id=>{tasks.delete(id as number);}});
 return{queue,setEnabled(x:boolean){enabled=x;},expiresAt(x:number){expires=x;},timers:()=>tasks.size,
  async tick(ms:number){time+=ms;for(let i=0;i<100;i++){const due=[...tasks].filter(([,t])=>t.at<=time);if(!due.length)break;for(const[id,t]of due){tasks.delete(id);t.run();}await flush();}await flush();}};
}
const ack=(input:ReviewInteractionInput)=>({status:200,body:{success:true,taxonomyVersion:2,eventId:input.eventId}});
test('no event is queued before consent; only later actual selections can be acknowledged',async()=>{
 let sent=0;const h=harness(async x=>{sent++;return ack(x);});h.setEnabled(false);
 assert.equal(h.queue.enqueue('review.visit'),false);assert.equal(h.queue.pending(),0);assert.equal(h.timers(),0);
 h.setEnabled(true);assert.equal(h.queue.enqueue('module.select',{section:'plans'}),true);await flush();
 assert.equal(sent,1);assert.equal(h.queue.pending(),0);h.queue.dispose();
});
test('lost ACK retries the same UUID and payload; matching explicit acknowledgement removes it',async()=>{
 const seen:ReviewInteractionInput[]=[],persisted=new Set<string>();
 const h=harness(async x=>{seen.push(x);persisted.add(x.eventId);return seen.length===1?{status:503}:ack(x);});
 const id=randomUUID();h.queue.enqueue('review.visit',{},id);await flush();assert.equal(h.queue.pending(),1);
 await h.tick(1000);assert.equal(seen.length,2);assert.deepEqual(seen[0],seen[1]);assert.equal(seen[0].eventId,id);assert.equal(persisted.size,1);assert.equal(h.queue.pending(),0);h.queue.dispose();
});
test('wrong ACK identity or version never counts as success and retries stop after three attempts',async()=>{
 let sent=0;const h=harness(async()=>{sent++;return{status:200,body:{success:true,taxonomyVersion:1,eventId:randomUUID()}};});
 h.queue.enqueue('review.visit');await flush();await h.tick(1000);await h.tick(3000);
 assert.equal(sent,3);assert.equal(h.queue.pending(),0);assert.equal(h.timers(),0);h.queue.dispose();
});
test('queue bounds, hung transport timeout and unmount cancellation never persist or grow without bound',async()=>{
 const signals:AbortSignal[]=[];const h=harness(async(_,signal)=>{signals.push(signal);return new Promise(()=>{});});
 for(let i=0;i<20;i++)assert.equal(h.queue.enqueue('review.visit'),true);
 assert.equal(h.queue.enqueue('review.visit'),false);await flush();assert.equal(signals.length,1);
 await h.tick(8000);assert.equal(signals[0].aborted,true);await h.tick(1000);
 // Another due event can use the single transport slot while the original waits for its retry.
 assert.equal(signals.length,2);h.queue.dispose();assert.equal(signals[1].aborted,true);assert.equal(h.queue.pending(),0);assert.equal(h.timers(),0);
});
test('withdrawal immediately aborts and discards; late ACK cannot acknowledge a newly queued event with the same UUID',async()=>{
 const pending:((x:InteractionAck)=>void)[]=[],signals:AbortSignal[]=[];
 const h=harness(async(_,signal)=>{signals.push(signal);return new Promise(r=>{pending.push(r);});}),id=randomUUID();
 h.queue.enqueue('review.visit',{},id);await flush();h.setEnabled(false);h.queue.clear();
 assert.equal(signals[0].aborted,true);assert.equal(h.queue.pending(),0);assert.equal(h.queue.enqueue('review.visit'),false);
 h.setEnabled(true);h.queue.enqueue('review.visit',{},id);await flush();
 pending[0]({status:200,body:{success:true,taxonomyVersion:2,eventId:id}});await flush();assert.equal(h.queue.pending(),1);
 pending[1]({status:200,body:{success:true,taxonomyVersion:2,eventId:id}});await flush();assert.equal(h.queue.pending(),0);h.queue.dispose();
});
test('the server-based remaining deadline aborts pending activity exactly at expiry and prevents any later dispatch',async()=>{
 let sent=0,signal!:AbortSignal;const h=harness(async(_,s)=>{sent++;signal=s;return new Promise(()=>{});});h.expiresAt(1500);
 h.queue.enqueue('review.visit');await flush();await h.tick(1500);
 assert.equal(signal.aborted,true);assert.equal(h.queue.pending(),0);assert.equal(h.queue.enqueue('review.visit'),false);assert.equal(sent,1);h.queue.dispose();
});
test('offline and rate responses use bounded retries, while authorization denial discards the whole queue',async()=>{
 let sent=0;const h=harness(async()=>{sent++;if(sent===1)throw new Error('offline');return {status:429};});
 h.queue.enqueue('review.visit');await flush();await h.tick(1000);await h.tick(3000);
 assert.equal(sent,3);assert.equal(h.queue.pending(),0);h.queue.dispose();
 const denied=harness(async()=>({status:403}));denied.queue.enqueue('review.visit');denied.queue.enqueue('account.open');await flush();
 assert.equal(denied.queue.pending(),0);assert.equal(denied.queue.enqueue('review.visit'),false);denied.queue.dispose();
});
test('invalid metadata is rejected before enqueue, and TTL discards old selections instead of replaying them after reconnect',async()=>{
 let sent=0;const h=harness(async()=>{sent++;return new Promise(()=>{});});
 assert.equal(h.queue.enqueue('module.select',{section:'arbitrary'} as never),false);
 assert.equal(h.queue.enqueue('review.visit',{documentId:'hidden'}),false);
 assert.equal(h.queue.enqueue('review.visit',{eventId:randomUUID()} as never),false);
 h.queue.enqueue('review.visit');await flush();await h.tick(30000);assert.equal(sent,1);assert.equal(h.queue.pending(),0);assert.equal(h.timers(),0);h.queue.dispose();
});

test('a real privacy withdrawal notification immediately aborts the shared queue observer',async()=>{
 clearGuestAnalytics();let signal:AbortSignal|undefined;
 const queue=createReviewInteractionQueue({permitted:()=>guestAnalyticsAllowed('review-observer'),remainingMs:()=>guestAnalyticsRemainingMs('review-observer'),send:async(_,s)=>{signal=s;return new Promise(()=>{});}});
 const unsubscribe=subscribeGuestPrivacy(()=>{if(!guestAnalyticsAllowed('review-observer'))queue.clear();});
 try{
  assert.equal(queue.enqueue('review.visit'),false);
  installGuestPrivacyChoice({version:GUEST_PRIVACY_VERSION,reviewId:'review-observer',asOf:1000,expiresAt:10000,optionalAnalytics:true});
  queue.enqueue('review.visit');await flush();assert.equal(queue.pending(),1);
  clearGuestAnalytics();assert.equal(signal!.aborted,true);assert.equal(queue.pending(),0);
 }finally{unsubscribe();queue.dispose();clearGuestAnalytics();}
});
