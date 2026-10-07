# Independently reproducible security evidence

This page lets another person check the published finding. Running the tools independently is possible; an independent reviewer has not yet accepted or certified this work.

## Download and reproduce

The [0.1.1 release](https://github.com/tommybear416/http-privacy-guard/releases/tag/v0.1.1) contains a versioned offline evidence archive, its SHA-256 checksum and recorded results:

- [Evidence archive](https://github.com/tommybear416/http-privacy-guard/releases/download/v0.1.1/ghsa-mjww-fjrv-p72m-evidence-v1.zip)
- [Archive and results checksums](https://github.com/tommybear416/http-privacy-guard/releases/download/v0.1.1/ghsa-mjww-fjrv-p72m-evidence-v1.sha256)
- [Machine-readable results](https://github.com/tommybear416/http-privacy-guard/releases/download/v0.1.1/ghsa-mjww-fjrv-p72m-evidence-v1.results.json)

Compare the downloaded archive with its recorded checksum, extract it, and use Node.js 22 or later:

```sh
node reproduce.mjs
```

No npm install, network access, private website login or member data is needed. The verifier checks source-file hashes before importing either implementation. It then prints the actual response-header values and checks the following before/after result:

| Source | Six private-boundary checks | Two explicit public controls |
| --- | --- | --- |
| 0.1.0 | Six fail the private targeted-header restriction | Both pass |
| 0.1.1 | All six pass | Both pass |

Exit 0 means the expected regression and correction were reproduced. It does not mean that the affected version is secure. The evidence builder also checks that modifying a source file causes verification to reject it before import.

The bundle includes only the exact public HTTP implementation, its error class, the MIT licenses, the verifier and evidence files. SHA-256 records detect differences from the recorded bundle; they are not a digital signature, independent audit or verified identity check.

## Regenerate from public source

Use a clean clone containing these fixed commits:

- Before correction: [d25480e04d9b687306b0a9b4509d459f9283c9cc](https://github.com/tommybear416/http-privacy-guard/commit/d25480e04d9b687306b0a9b4509d459f9283c9cc), package version 0.1.0.
- Released correction: [6556b78de2133286e981b4e22feb6325da2f1538](https://github.com/tommybear416/http-privacy-guard/commit/6556b78de2133286e981b4e22feb6325da2f1538), package version 0.1.1.

```sh
git clone https://github.com/tommybear416/http-privacy-guard.git
cd http-privacy-guard
node scripts/build-advisory-evidence.mjs --output /tmp/privacy-guard-evidence-review
node scripts/reproduce-cache-precedence.mjs /tmp/privacy-guard-evidence-review
```

Choose a new output directory; the builder refuses to overwrite an existing one. `source-receipt.json` records the two source commits and Git trees, the evidence tools' commit, source hashes, maintainer attribution and AI assistance. The same evidence builder runs in the project's Node.js 22/24 CI, alongside the existing 42-test synthetic suite and package-boundary checks. CI checks reproduce behavior; they do not independently accept a report.

## Maintenance record and responsibilities

| Date | Completed work | Evidence and owner responsibility |
| --- | --- | --- |
| 2026-10-07 | Reproduced vendor-specific cache-policy conflict in the initial release | Six failing private cases; AI-assisted source review requested by the owner |
| 2026-10-07 | Released 0.1.1 remediation | Exact-source fix commit and [42-test checks](https://github.com/tommybear416/http-privacy-guard/actions/runs/37644776353); owner coordinates remediation and release review |
| 2026-10-07 | Published the advisory and name/account association | [GHSA-mjww-fjrv-p72m](https://github.com/tommybear416/http-privacy-guard/security/advisories/GHSA-mjww-fjrv-p72m), [MAINTAINERS](../MAINTAINERS.md); Yitong Chen / tommybear416 credited as coordinator |
| 2026-10-07 | Made the finding independently reproducible | Public offline evidence, checksums and checksum-tamper negative control; this is evidence publication, not an outside review |

Security reports are handled through [private vulnerability reporting](https://github.com/tommybear416/http-privacy-guard/security/policy). The maintainer owns triage, reproductions, corrective decisions, disclosure and supported-version documentation. AI assistance and automated checks support those duties; they are not an external auditor. Maintenance occurs at the owner's instruction, with no guaranteed response SLA or continuous monitoring service.

## What the evidence does and does not establish

The finding is a contradictory origin-header policy: the affected version can preserve a cache-enabled vendor-specific header while setting generic private restrictions. Provider documentation supports the conditional priority concern: [Cloudflare](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/) and [Vercel](https://vercel.com/docs/caching/cache-control-headers).

Actual exposure requires the guard to execute at an origin before caching, an otherwise cache-eligible response, and relevant routing, cache-key and platform rules. A `Set-Cookie` case demonstrates the library's forced-private path; it does not prove that a provider caches that response. No live CDN execution, exploit against a third-party target, affected production consumer or observed data leakage has been established. The library cannot override every platform rule or purge previously cached objects.

This component's owner also operates the UTSTA member/document platform, and the controls address privacy boundaries relevant to that work and planned health-related data. This publication does not establish a deployed downstream integration, independent adoption or a change to website traffic. Member information, private application configuration and private source history are excluded.

The public name/account link and project advisory are available for provider review. A GHSA coordinator credit is attribution; it is not independent acceptance of a vulnerability disclosure. CVE assignment, bug-bounty standing, independent downstream adoption and eligibility for Defense Access are not claimed by this evidence package. Any later official CVE status should be checked against the published advisory, not inferred from this archive.
