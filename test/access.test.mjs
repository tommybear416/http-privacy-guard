import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeResource, GuardError} from '../src/index.mjs';

const now = Date.parse('2026-01-01T00:00:00Z');
const resource = {id:'fictional-document',tenantId:'fictional-group',ownerId:'fictional-member-a'};
const owner = {id:resource.ownerId,tenantId:resource.tenantId,verified:true};
const other = {...owner,id:'fictional-member-b'};
const grant = {resourceId:resource.id,tenantId:resource.tenantId,actions:['read','download'],expiresAt:'2026-01-01T00:01:00Z'};
const policy = {action:'download',now};
const deny = (subject, file = resource, p = policy) => assert.throws(() => authorizeResource(subject,file,p), error => error instanceof GuardError && error.status === 404 && error.code === 'resource_access_denied');

test('verified owner can read/download but cannot modify signed material by default', () => {
  for (const action of ['read','download']) assert.equal(authorizeResource(owner,resource,{...policy,action}).authority, 'owner');
  for (const action of ['update','delete']) deny(owner,resource,{...policy,action});
  assert.equal(authorizeResource(owner,resource,{...policy,action:'update',ownerActions:['update']}).action,'update');
});
test('anonymous, unverified and cross-account requests are denied', () => {
  for (const subject of [null,{}, {...owner,verified:false},{...owner,verified:'true'},other]) deny(subject);
  for (const key of ['id','tenantId']) for (const value of ['', ' ', 'a'.repeat(301),null]) deny({...owner,[key]:value});
});
test('displayed admin labels and caller-invented public flags do not grant access', () => {
  deny({...other,admin:true,role:'owner',isAdmin:true});
  deny(other,{...resource,public:true,classification:'public'});
});
test('tenant boundary is mandatory even for the same user or a resource grant', () => {
  deny({...owner,tenantId:'different-group'});
  deny({...other,tenantId:'different-group',grants:[grant]});
  for (const key of ['id','tenantId','ownerId']) deny(owner,{...resource,[key]:''});
});
test('only a live exact resource, tenant and action grant can authorize a non-owner', () => {
  const subject = {...other,grants:[grant]};
  const result = authorizeResource(subject,resource,policy);
  assert.equal(result.authority,'grant');
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.resourceId,resource.id);
  for (const patch of [{resourceId:'*'},{resourceId:'different-document'},{tenantId:'other-group'},{actions:['update']},{actions:['download','unknown']},{actions:'download'},{expiresAt:'2026-01-01T00:00:00Z'},{expiresAt:'2025-01-01T00:00:00Z'},{expiresAt:'2026-02-30T00:00:00Z'},{expiresAt:'invalid'},{expiresAt:null}]) deny({...other,grants:[{...grant,...patch}]});
  for (const grants of [undefined,'admin',[],[null],{}]) deny({...other,grants});
});
test('bad access policy is rejected as configuration failure', () => {
  for (const p of [{...policy,action:'execute'},{...policy,now:NaN},{...policy,now:-1},{...policy,ownerActions:'*'},{...policy,ownerActions:['unknown']}]) {
    assert.throws(() => authorizeResource(owner,resource,p),error => error.code === 'invalid_access_policy' && error.status === 500);
  }
});
