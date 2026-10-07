# Threat model and integration boundaries

Version: 0.1.1. All demonstrations and tests use synthetic inputs.

## Assets and trust boundaries

The intended assets are private member documents, account-scoped responses and release source artifacts. A browser may choose headers, query parameters, resource IDs and body fields. Those choices do not establish a subject, tenant, resource owner, administrator role, public-resource classification or permission grant.

An application supplies a verified session and trusted database metadata to the library. A resource grant has an exact resource ID, tenant ID, action list and UTC expiration. The server supplies the clock and owner policy. Authorization runs before reading bytes from private storage, issuing a signed URL or mutating a resource. A denial should not reveal whether another member's document exists.

## Coverage matrix

| Threat | Implemented control | Evidence | Application work still required |
| --- | --- | --- | --- |
| Shared/browser caches reuse a member response | Private default, browser/CDN/shared and Cloudflare/Vercel targeted `no-store`, removed validators, `Vary` | HTTP tests; documented origin-header precedence regressions; synthetic endpoint tests | Execute at the origin before caching; purge old copies, audit CDN rules and explicit service-worker/Cache API writes |
| Another account requests a document by ID | Verified-subject, owner/exact-grant checks and default 404 denial | Authorization and endpoint tests prove denial before storage read | Secure session verification, trusted metadata loading and all storage/signing paths |
| Cross-tenant access, stale grants or display-role spoofing | Same tenant, exact resource/action, expiration, no implicit admin privilege | Negative authorization tests | Correct grant issuance/revocation and current database state |
| A hostile site submits a browser write | Exact configured Origin, request URL and Fetch Metadata checks | Mutation tests with missing/null/hostile origins | Authentication, per-write authorization, HTTPS, cookie policy and dedicated service-client authentication |
| Environment/key files enter a source release | Local filename, symlink, size/binary and selected token-shape checks | Artifact tests with constructed synthetic values | Manual file/history review and a full secret scanner where appropriate |

## Explicit limits

- A caller can spoof headers in a non-browser client. The origin guard protects a browser boundary, not an API credential or session.
- `verified: true` means the application has already authenticated that subject. It is not a verification algorithm. Caller-controlled IDs/grants make any authorization library ineffective.
- Public visibility and existing CSP are trusted application policies. This component does not determine whether a file is safe to publish or whether an inherited CSP is sufficiently strict.
- HTTP headers alone do not prevent intentional cache/storage writes, screenshots, already downloaded copies, logs, compromised clients or a malicious authorized operator.
- The scanner skips `.git` and `node_modules`, follows no file symlinks, rejects uninspected binary/large files, and recognizes a limited set of textual credential shapes. It is not a repository-history, PII or comprehensive secrets scanner. Run it on an isolated stable directory; concurrent directory replacement is outside its security guarantee.
- Encryption at rest, R2/D1/IAM configuration, MFA/passkeys, log redaction, retention/deletion, backup recovery, signing integrity, abuse limits and incident response belong to the application. They have not been implemented or validated by this project.

An organization handling health/legal information needs those additional controls and its own assessment. This component addresses specific technical boundaries and makes no legal compliance attestation.

## References

The behavioral choices align with [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [HTTP header guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) and [web cache security guidance](https://cheatsheetseries.owasp.org/cheatsheets/Web_Cache_Security_Cheat_Sheet.html). These references do not constitute an OWASP endorsement or audit of this code.
