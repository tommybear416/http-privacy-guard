import test from 'node:test';
import assert from 'node:assert/strict';
import {memberDocumentHandler} from '../examples/member-document-handler.mjs';

test('private document boundary denies another account before the storage read', async () => {
  let reads = 0;
  const resource = {id:'demo-document',ownerId:'member-a',tenantId:'demo-group'};
  const adapters = {getVerifiedSession:async () => ({id:'member-b',tenantId:'demo-group',verified:true}),findResource:async () => resource,readDocument:async () => {reads++; return 'fictional contents';}};
  const response = await memberDocumentHandler(new Request('https://portal.example.test/documents?id=demo-document&public=true',{headers:{'x-role':'admin'}}),adapters);
  assert.equal(response.status,404);
  assert.equal(reads,0);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.deepEqual(await response.json(),{error:'resource_access_denied'});
});
test('verified owner receives a private non-cacheable response after authorization', async () => {
  let reads = 0;
  const resource = {id:'demo-document',ownerId:'member-a',tenantId:'demo-group'};
  const response = await memberDocumentHandler(new Request('https://portal.example.test/documents?id=demo-document'),{
    getVerifiedSession:async () => ({id:'member-a',tenantId:'demo-group',verified:true}),findResource:async () => resource,
    readDocument:async (_,decision) => {assert.equal(decision.authority,'owner');reads++;return 'fictional contents';}
  });
  assert.equal(response.status,200);assert.equal(reads,1);
  assert.equal(response.headers.get('cdn-cache-control'),'no-store');
  assert.equal(await response.text(),'fictional contents');
});
test('unsupported methods and failed adapters cannot reveal application errors', async () => {
  const unused = {getVerifiedSession:async () => {throw new Error('fictional confidential detail');}};
  const method = await memberDocumentHandler(new Request('https://portal.example.test/documents',{method:'POST'}),unused);
  assert.equal(method.status,405);
  const failed = await memberDocumentHandler(new Request('https://portal.example.test/documents'),unused);
  assert.equal(failed.status,500);assert.equal((await failed.text()).includes('confidential'),false);
});
