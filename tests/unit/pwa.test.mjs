import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/pwa.js','utf8');

function eventTarget(){
  const listeners={};
  return {
    listeners,
    addEventListener(type,handler){ listeners[type]=handler; },
  };
}

function element(tag){
  const target=eventTarget();
  return {
    ...target,tag,children:[],dataset:{},disabled:false,id:'',className:'',
    setAttribute(){},
    append(...children){ this.children.push(...children); },
  };
}

test('service-worker activation reloads only after the user accepts an update',async()=>{
  const serviceWorker=eventTarget();
  serviceWorker.controller={};
  const registration=eventTarget();
  const waiting={messages:[],postMessage(message){ this.messages.push(message); }};
  registration.waiting=waiting;
  registration.installing=null;
  serviceWorker.register=async()=>registration;
  const elements=new Map();
  const body=element('body');
  body.appendChild=child=>elements.set(child.id,child);
  let reloads=0;
  const context=vm.createContext({
    navigator:{serviceWorker},
    document:{
      body,
      getElementById(id){ return elements.get(id)||null; },
      createElement:element,
    },
    location:{reload(){ reloads++; }},
    console:{warn(){}},
  });

  new vm.Script(source,{filename:'pwa.js'}).runInContext(context);
  await Promise.resolve();
  await Promise.resolve();

  serviceWorker.listeners.controllerchange();
  assert.equal(reloads,0);
  const banner=elements.get('updateBanner');
  assert.ok(banner);
  const button=banner.children[1];
  button.listeners.click();
  assert.equal(waiting.messages.length,1);
  assert.equal(waiting.messages[0].type,'SKIP_WAITING');
  serviceWorker.listeners.controllerchange();
  assert.equal(reloads,1);
  serviceWorker.listeners.controllerchange();
  assert.equal(reloads,1);
});
