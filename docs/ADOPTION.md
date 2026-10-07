# Security work and application evidence

Evidence reviewed on 2026-10-07. This page records the project owner's actual work and the limits of the available evidence. It does not certify eligibility for an external access program.

## Published evidence

| Item | Public evidence | What it establishes |
| --- | --- | --- |
| Name, account and role | [MAINTAINERS.md](../MAINTAINERS.md) | Owner-authorized association of Yitong Chen with tommybear416 and the security-maintainer responsibilities |
| Open-source project | [HTTP Privacy Guard](https://github.com/tommybear416/http-privacy-guard) | Public MIT-licensed source |
| Security advisory | [GHSA-mjww-fjrv-p72m](https://github.com/tommybear416/http-privacy-guard/security/advisories/GHSA-mjww-fjrv-p72m) | A published advisory for a real defect in this project; the owner is credited as coordinator and AI assistance is disclosed |
| Released fix | [0.1.1 source release](https://github.com/tommybear416/http-privacy-guard/releases/tag/v0.1.1) | Released correction at source commit 6556b78de2133286e981b4e22feb6325da2f1538 |
| Reproduction and patch | [Security change](SECURITY-CHANGE-0.1.1.md) and [patch commit](https://github.com/tommybear416/http-privacy-guard/commit/6556b78de2133286e981b4e22feb6325da2f1538) | Six private-boundary regression cases fail before the fix and pass after it; two public controls retain intended behavior |
| Fix verification | [Node.js 22/24 checks at the released source](https://github.com/tommybear416/http-privacy-guard/actions/runs/37644776353) | 42 synthetic tests per runtime, source scanning and the 15-file package boundary |
| Offline review | [Reproduction and maintenance record](VERIFICATION.md) | Exact before/after public source, file hashes, downloadable evidence and checksum-tamper rejection; independently reproducible, not independently accepted |
| Reporting channel | [Security policy](https://github.com/tommybear416/http-privacy-guard/security/policy) | Private vulnerability reporting is enabled |

The 0.1.0 defect preserved cache-enabled provider-specific CDN headers while applying generic private caching restrictions. Version 0.1.1 replaces the Cloudflare- and Vercel-specific policies with `no-store` at private boundaries. Cache exposure is conditional on origin placement, cache eligibility and platform rules. The contradictory response headers were reproduced offline; no live CDN exploit, observed data leak or affected production consumer has been established.

The implemented controls are private-response caching, browser write origins, account/tenant resource authorization and a bounded offline artifact scanner. See the [threat model](THREAT-MODEL.md) for integration requirements. No external audit or production security certification has been established.

## Relationship to the owner's member/document platform

The owner also operates the UTSTA member/document platform. This independent component was created for privacy controls relevant to that platform, including private-document access and planned protection of health-related records. Security review uses source code and synthetic examples rather than member records.

This relationship describes ownership and defensive purpose. The component has not been verified as integrated into the deployed platform. No website release or traffic change is part of this evidence publication, and this relationship is not an independent adoption metric. The private application source, configuration and member data are outside this public repository.

## Individual application route

The supplied Verification Portal form offers an accepted vulnerability disclosure or an advisory published under the applicant's name as one evidence option. The published advisory above is a candidate for the advisory branch, with the owner-published name/account link and released fix as supporting evidence. The provider decides whether a self-owned project's AI-assisted advisory is sufficient.

The GHSA coordinator credit is an attribution, not independent acceptance of a vulnerability report or an external qualification. There is no assigned CVE and no independently accepted third-party report or verified bug-bounty track record in this evidence package. Do not select those credentials on that basis.

The [official application guidance](https://support.claude.com/en/articles/14604842-cyber-verification-program) describes individual Defense Access and provider review. Account and [security requirements](https://support.claude.com/en/articles/17202708-cyber-verification-program-security-requirements) must be confirmed by the applicant. Publishing an advisory does not guarantee approval.

## Adoption metrics

No independent downstream adopter has been verified. No npm publication or monthly registry download count, Debian/Fedora/Homebrew core inclusion, or ecosyste.ms critical flag has been established. There is currently no qualifying adoption-figure link to supply for the separate open-source-maintainer credential.

Intended integration, an unmerged candidate, an owner-controlled example, documentation or CI does not prove production adoption or independent ecosystem use. Record an adopter only with its consent and a real integration plus verifiable dependency evidence. Stars, forks and newly created examples are not the supplied form's adoption metrics. No numeric adoption minimum appears in the supplied form or the public guidance reviewed; only the provider can determine whether particular evidence qualifies.

## Defensive work description

The applicant may use this three-sentence draft if it matches the intended scope:

> I am Yitong Chen (GitHub: tommybear416), the owner and security maintainer of HTTP Privacy Guard, and I coordinate vulnerability reproduction, remediation and disclosure with AI assistance. My defensive scope covers this component and the UTSTA member/document systems I operate, focusing on private-response caching, browser-origin checks and account/tenant access controls for sensitive records, including planned health-related data. I request Defense Access to assess these authorized systems, reproduce issues using synthetic data and develop fixes.

This scope does not claim that the component is already deployed in the private platform. The applicant completes identity verification, confirms account/security requirements and submits the application personally.
