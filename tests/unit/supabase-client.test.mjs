import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=`${fs.readFileSync('public/lib.js','utf8')}\n`+
  `${fs.readFileSync('public/supabase-client.js','utf8')}\n`+
  'globalThis.__PokemonDb=PokemonDb;';

function clientWith(fetchImpl){
  const context=vm.createContext({
    SUPABASE_CONFIG:{url:'https://project.supabase.co/',publishableKey:'publishable'},
    fetch:fetchImpl,
    localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
    location:{hash:'',pathname:'/tracker.html',search:'',href:'https://tracker.test/tracker.html'},
    history:{replaceState(){}},
    URL,
    URLSearchParams,
    Date,
    Math,
    JSON,
    encodeURIComponent,
  });
  new vm.Script(source,{filename:'public/supabase-client.js'}).runInContext(context);
  return context.__PokemonDb;
}

test('setQuantities sends one authenticated transactional RPC request',async()=>{
  let request;
  const expected=[{id:'pikachu',quantity:4},{id:'eevee',quantity:2}];
  const client=clientWith(async(url,options)=>{
    request={url,options};
    return {ok:true,async json(){return expected;}};
  });

  const result=await client.setQuantities(
    {access_token:'editor-token'},
    expected.map(change=>({...change,ignored:'local-only'})),
  );

  assert.equal(request.url,'https://project.supabase.co/rest/v1/rpc/set_collection_quantities');
  assert.equal(request.options.method,'POST');
  assert.equal(request.options.headers.Authorization,'Bearer editor-token');
  assert.equal(request.options.headers.apikey,'publishable');
  assert.equal(request.options.headers['Content-Type'],'application/json');
  assert.deepEqual(JSON.parse(request.options.body),{changes:expected});
  assert.deepEqual(result,expected);
});
