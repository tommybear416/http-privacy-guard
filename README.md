# HTTP Privacy Guard

Small, dependency-free defensive controls for Fetch-based services that handle private member documents. The runtime works with Node.js 22+ and Fetch-compatible server environments; the offline artifact scanner requires Node.js.

The first release addresses four concrete boundaries: private-response caching, browser write origins, account/tenant access to individual resources, and accidental publication of selected sensitive artifact types. It includes a synthetic document endpoint that denies another account before reading storage. No participant records, application source, deployment configuration or private Git history are part of this project.

## Status and installation

Version 0.1.1 corrects targeted CDN cache-header precedence in the initial implementation. An external audit, production integration and independent downstream adoption have not been established. The package is not published to npm. Registry download counts are therefore unavailable.

See the [0.1.1 security change](docs/SECURITY-CHANGE-0.1.1.md) for the affected boundary, synthetic reproduction and upgrade guidance. The published [security advisory](https://github.com/tommybear416/http-privacy-guard/security/advisories/GHSA-mjww-fjrv-p72m) records the AI-assisted review, owner-coordinated remediation and released fix.

After a public source commit has been published, install from its full reviewed commit SHA:

```sh
npm install github:tommybear416/http-privacy-guard#<full-reviewed-commit-sha>
```

For a local evaluation, use Node.js 22+ and run `npm ci --ignore-scripts`, `npm test`, `npm run test:coverage` and `npm run check:release`. The repository has no runtime or development package dependencies.

## Use at a private document boundary

```js
import {authorizeResource, hardenResponseHeaders} from '@tommybear416/http-privacy-guard';

// These adapters belong to your application. Verify the session, and load
// resource ownership and grants from trusted server-side storage.
const subject = await getVerifiedSession(request);
const resource = await loadResourceMetadata(requestedDocumentId);
authorizeResource(subject, resource, {action: 'download'});

// Authorization must precede every storage read and signed-URL issuance.
const bytes = await readPrivateDocument(resource.id);
return new Response(bytes, {
  headers: hardenResponseHeaders({'Content-Type': 'application/pdf'})
});
```

The complete executable [example](examples/member-document-handler.mjs) and [integration tests](test/integration.test.mjs) use synthetic data. Copy the pattern into the server boundary where an authenticated request meets private object storage. Load IDs and grants from your database; never populate `verified`, ownership or grants from a browser JSON body.

## API

| Function | Behavior | Required trusted input |
| --- | --- | --- |
| `hardenResponseHeaders(headers, policy?)` | Defaults to private; forces `no-store` for browser/CDN/shared-cache headers, removes cache validators, merges `Vary`, adds default browser protections | Server-chosen visibility and reviewed CSP |
| `preventPrivateCaching(headers)` | Applies only the private cache/validator/robots policy; preserves existing browser/CSP headers and adds no CSP | A server-established private response boundary |
| `guardMutation(request, expectedOrigin)` | Permits POST/PUT/PATCH/DELETE only; requires the exact configured origin in the request URL and Origin header; rejects contradictory Fetch Metadata | A fixed deployment origin, never a forwarded header supplied by the caller |
| `assertSameOrigin(request, expectedOrigin)` | Performs the same origin check without imposing a method | A fixed deployment origin |
| `authorizeResource(subject, resource, policy)` | Denies by default; requires a verified subject and the same tenant; permits owner read/download or a live exact-resource/action grant | Verified session, database metadata, database grants, server clock and policy |
| `scanArtifacts(directory, bounds?)` from `/artifacts` | Reads local text artifacts with bounds; rejects selected sensitive names, symlinks, binary/oversized files and selected credential shapes; reports paths/rules only | An isolated, stable release directory |

`GuardError` exposes a stable `code` and HTTP `status`, without resource details. Denied resource requests use 404. Owner update/delete needs an explicit server policy; the library does not establish whether a legal document is editable.

```js
import {guardMutation} from '@tommybear416/http-privacy-guard';
guardMutation(request, 'https://portal.example.test');
// Authenticate the session and authorize the write separately.
```

Private is the safe default. Use `{visibility: 'public'}` only after a server has established that a resource is public and contains no account-specific material. A response with `Set-Cookie` is forced private even under that option. An existing CSP is preserved; it must already have been reviewed. The default CSP blocks all resource loading and is appropriate for document/API responses. HTML pages need their own reviewed policy. Applications with an existing browser/CSP policy can call `preventPrivateCaching` at their private response boundary instead. HSTS is only added when both an HTTPS URL and an explicit `hstsMaxAge` are supplied.

## Security scope

Cache headers do not purge previously cached data or control explicitly programmed service-worker/Cache API writes. Origin checks do not authenticate service clients. Resource authorization does not implement login, MFA, grant issuance, administrator policy, encryption, backups, signature verification or audit retention. The artifact scanner cannot detect every secret or any arbitrary health/legal data. Read the [threat model](docs/THREAT-MODEL.md) before integration.

This project does not certify HIPAA, PIPEDA, PHIPA or other legal compliance, and does not guarantee that sensitive data cannot leak. Do not put real member data in examples, tests or issue reports.

## Maintenance and evidence

- [Maintainer responsibilities](MAINTAINERS.md)
- [Security reporting and support](SECURITY.md)
- [Contribution and release process](CONTRIBUTING.md)
- [Security work and application evidence](docs/ADOPTION.md)

The project is licensed under [MIT](LICENSE). Recipients may use, copy and modify this component under that license. The license grants no rights to a separate private application or its data.
