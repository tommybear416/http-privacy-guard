import {authorizeResource, hardenResponseHeaders, GuardError} from '../src/index.mjs';

/** All adapters are trusted server functions. No subject/grants are accepted from a request body. */
export async function memberDocumentHandler(request, {getVerifiedSession, findResource, readDocument}) {
  try {
    if (request.method !== 'GET') throw new GuardError('method_denied',405);
    const subject = await getVerifiedSession(request);
    const resourceId = new URL(request.url).searchParams.get('id');
    const resource = await findResource(resourceId);
    const decision = authorizeResource(subject,resource,{action:'download'});
    const contents = await readDocument(resource,decision);
    return new Response(contents,{headers:hardenResponseHeaders({'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="document.bin"'})});
  } catch (error) {
    const status = error instanceof GuardError ? error.status : 500;
    const code = error instanceof GuardError ? error.code : 'internal_error';
    return new Response(JSON.stringify({error:code}),{status,headers:hardenResponseHeaders({'Content-Type':'application/json'})});
  }
}
