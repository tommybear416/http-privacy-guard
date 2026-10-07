import {GuardError, authorizeResource, guardMutation, hardenResponseHeaders, type Subject, type Resource} from '@tommybear416/http-privacy-guard';
import {scanArtifacts, type ArtifactScan} from '@tommybear416/http-privacy-guard/artifacts';
const subject: Subject = {id:'member-synthetic',tenantId:'team-synthetic',verified:true};
const resource: Resource = {id:'doc-synthetic',tenantId:'team-synthetic',ownerId:subject.id};
const decision = authorizeResource(subject,resource,{action:'download'});
const authority: 'owner' | 'grant' = decision.authority;
const headers: Headers = hardenResponseHeaders({'Content-Type':'application/pdf'});
guardMutation(new Request('https://portal.example.test',{method:'POST'}),'https://portal.example.test');
const result: Promise<ArtifactScan> = scanArtifacts('/synthetic-release');
const error: Error = new GuardError('synthetic_error');
void [authority,headers,result,error];
// @ts-expect-error An unknown action cannot be granted.
authorizeResource(subject,resource,{action:'admin'});
