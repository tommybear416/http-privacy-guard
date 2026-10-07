# Targeted CDN cache-header correction in 0.1.1

## Affected boundary

Version 0.1.0 preserves incoming `Cloudflare-CDN-Cache-Control` and `Vercel-CDN-Cache-Control` headers while applying a private browser policy and generic CDN `no-store`. If an application supplies a cache-enabled value in a provider-specific header, that more specific value can take precedence over the generic policy.

This affects `preventPrivateCaching` and the private path of `hardenResponseHeaders`, including a response forced private by `Set-Cookie`. Exposure depends on a cache-eligible origin response, provider behavior and the deployment's cache key/rules. The HTTP-header defect was reproduced offline. No live CDN test, production leak or affected downstream deployment has been established.

## Correction

Version 0.1.1 also sets both provider-specific headers to `no-store` at the private boundary. An explicitly public, cookie-free response retains its caching policy. Existing CSP, cookies and the caller's original Headers object are preserved.

These controls must execute at the origin before a cache makes its decision. A later response rewrite cannot undo earlier caching. Upgrade the source dependency to the reviewed 0.1.1 commit and review the deployment's rules. Previously stored objects may require a separate purge; this library does not perform one. Forced platform caching and additional provider-specific headers require application review.

## Synthetic evidence

Eight regression cases cover the two providers at three private entry points plus two public positive controls. The six private cases fail against the original source; all eight pass after the correction. The full corrected suite has 42 passing tests, with 97.91% line, 96.08% branch and 100% function coverage. Public TypeScript declarations also pass strict compilation.

## Attribution

The source review, synthetic reproduction and remediation were prepared with AI assistance at the project owner's request. GitHub account [tommybear416](https://github.com/tommybear416) coordinates maintenance and disclosure. This record does not establish a verified legal identity, third-party acceptance, CVE assignment or access-program eligibility.

## Reproducible evidence

The [offline verification guide](VERIFICATION.md) and 0.1.1 release attachments provide the exact before/after HTTP sources, hashes, verifier and results. The verifier requires no network or member records. The cookie regression establishes the library's forced-private behavior; it does not establish that a real CDN caches that response. See [MAINTAINERS](../MAINTAINERS.md) for the owner-authorized Yitong Chen / tommybear416 name and role association.

## References

- [Cloudflare origin header precedence](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/)
- [Vercel cache-control header precedence](https://vercel.com/docs/caching/cache-control-headers)
- [CWE-524: Use of Cache Containing Sensitive Information](https://cwe.mitre.org/data/definitions/524.html)
