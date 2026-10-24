import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {VIEWER_REVIEW_BRIDGE_JS,VIEWER_REVIEW_BRIDGE_PATH,injectViewerReviewBridge,readViewerInteraction} from '../lib/viewer-interaction-bridge';
test('parent rejects wrong origin/window, unknown fields and invalid control metadata without accepting a frame event UUID',()=>{
 const source={},expected={origin:'https://tayco.test',source},data={type:'tayco-review-viewer-interaction',taxonomyVersion:2,elementId:'viewer.page.next',documentId:'doc-one',pageNumber:2};
 const event=(changes:Record<string,unknown>={})=>({origin:expected.origin,source,data,...changes}) as never;
 assert.deepEqual(readViewerInteraction(event(),expected),{elementId:'viewer.page.next',documentId:'doc-one',pageNumber:2});
 for(const bad of [event({origin:'https://other.test'}),event({source:{}}),event({source:null}),event({data:{...data,taxonomyVersion:1}}),event({data:{...data,eventId:'forged'}}),event({data:{...data,url:'/secret'}}),event({data:{...data,actorId:'other'}}),event({data:{...data,pageNumber:0}}),event({data:{...data,documentId:'private/path'}}),event({data:{...data,elementId:'arbitrary.click'}})])
  assert.equal(readViewerInteraction(bad,expected),undefined);
 assert.equal(readViewerInteraction(event(),{...expected,source:null}),undefined);
});
test('controlled viewer script stays silent until a matching parent enables it, then emits only selected bounded controls',()=>{
 let time=0;const listeners=new Map<string,(e:unknown)=>void>(),dom=new Map<string,(e:unknown)=>void>(),sent:unknown[]=[];
 const parent={postMessage:(...args:unknown[])=>sent.push(args)},window={parent,addEventListener:(kind:string,fn:(e:unknown)=>void)=>listeners.set(kind,fn)};
 class Element{
  dataset={documentId:'doc-one'};disabled=false;id='';textContent='PRIVATE DOCUMENT TITLE';value='';max='';
  closest(){return this;}matches(){return false;}
 }
 const location={origin:'https://tayco.test',href:'https://tayco.test/api/takeoff-viewer/viewer/?document=doc-one'};
 const document={addEventListener:(kind:string,fn:(e:unknown)=>void)=>dom.set(kind,fn),querySelector:()=>null,querySelectorAll:()=>[]};
 runInNewContext(VIEWER_REVIEW_BRIDGE_JS,{window,document,location,performance:{now:()=>time},Element,URL});
 const selected={isTrusted:true,target:new Element()},click=()=>dom.get('click')!(selected),enable={type:'tayco-review-viewer-control',taxonomyVersion:2,enabled:true,remainingMs:100};
 click();assert.equal(sent.length,0);
 listeners.get('message')!({origin:'https://other.test',source:parent,data:enable});click();assert.equal(sent.length,0);
 listeners.get('message')!({origin:location.origin,source:{},data:enable});click();assert.equal(sent.length,0);
 listeners.get('message')!({origin:location.origin,source:parent,data:{...enable,secret:'extra'}});click();assert.equal(sent.length,0);
 listeners.get('message')!({origin:location.origin,source:parent,data:enable});click();assert.equal(sent.length,1);
 const [payload,target]=sent[0] as [unknown,string];assert.equal(target,location.origin);
 assert.deepEqual(JSON.parse(JSON.stringify(payload)),{type:'tayco-review-viewer-interaction',taxonomyVersion:2,elementId:'viewer.document.select',documentId:'doc-one'});
 assert.equal(JSON.stringify(sent).includes('PRIVATE DOCUMENT'),false);
 dom.get('click')!({...selected,isTrusted:false});assert.equal(sent.length,1);
 time=100;click();assert.equal(sent.length,1);
 time=0;listeners.get('message')!({origin:location.origin,source:parent,data:{...enable,enabled:false,remainingMs:0}});click();assert.equal(sent.length,1);
});
test('shell injection uses one external same-origin script and never rewrites document contents or adds inline execution',()=>{
 for(const html of ['<html><head></head><body>fixture</body></html>','<html><body>fixture</body></html>']){
  const rewritten=injectViewerReviewBridge(html);assert.equal(rewritten.split(VIEWER_REVIEW_BRIDGE_PATH).length-1,1);
  assert.equal(injectViewerReviewBridge(rewritten),rewritten);assert.match(rewritten,/<script src="\/api\/takeoff-viewer\/static\/viewer-review-events\.js" defer><\/script>/);
  assert.equal(rewritten.includes('eval('),false);
 }
 assert.throws(()=>injectViewerReviewBridge('unexpected shell'),/unavailable/);
});
