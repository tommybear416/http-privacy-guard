# Adoption and application evidence

Evidence reviewed on 2026-10-07.

## Published maintenance evidence

| Item | Public evidence | What it establishes |
| --- | --- | --- |
| Open-source project | [HTTP Privacy Guard](https://github.com/tommybear416/http-privacy-guard) | Public MIT-licensed source |
| Security-maintainer role | [MAINTAINERS.md](../MAINTAINERS.md) | tommybear416's responsibilities for policy, triage, regressions and release review |
| Reporting channel | [Security policy](https://github.com/tommybear416/http-privacy-guard/security/policy) | Private vulnerability reporting is enabled |
| Technical checks | [Security checks for source commit bbf09d1](https://github.com/tommybear416/http-privacy-guard/actions/runs/37640299701) | Node.js 22/24 synthetic checks; 34 tests per runtime |
| Identity | Applicant-supplied public identity-to-handle link pending | The account's role alone does not establish a verified legal identity |

The implemented boundaries are private-response caching, browser write origins, account/tenant resource authorization and a bounded offline artifact scanner. See the [threat model](THREAT-MODEL.md) for control-specific evidence and integration requirements. No external audit or production security certification has been established.

## Adoption metrics

No independent downstream adopter has been verified. No npm publication or monthly registry download count, Debian/Fedora/Homebrew core inclusion, or ecosyste.ms critical flag has been established. There is currently no qualifying adoption-figure link to supply.

The component is intended for private-document applications. Intended integration, an unmerged candidate, an owner-controlled example or documentation describing a downstream relationship does not prove production adoption or independent ecosystem use. A separate private application's production deployment is outside the current publication scope.

Record an adopter only with its consent and evidence such as a public dependency manifest pinned to a release/source commit and a real integration that executes the control. Do not publish a private consumer's name, repository, architecture or usage data without authorization.

GitHub's [dependency-graph guidance](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/explore-dependencies) explains the public-repository dependents view. Private consumers and source-archive installations may not provide a public recognized-dependent count. Stars, forks, page views, CI runs and this repository's own tests are not the application form's adoption metrics.

## Individual application requirements

The Verification Portal form supplied by the maintainer asks an individual to document at least one security credential: credited vulnerability work, an accepted disclosure/advisory, verifiable bug-bounty standing, or a named security-maintainer role on an open-source project used by others. A description of intended defensive work does not replace that credential.

The project and role URLs above are available. The open-source maintainer credential still lacks verifiable adoption evidence and an applicant-provided identity link. No numeric adoption minimum appears in the supplied form or the public guidance reviewed on the date above; only the provider can determine whether particular evidence qualifies. Creating a repository or integrating one's own application does not guarantee approval.

The [official program announcement](https://www.anthropic.com/news/cyber-verification-program) and [application guidance](https://support.claude.com/en/articles/14604842-cyber-verification-program) describe Defense Access and provider verification. This repository makes no claim that the maintainer has been approved or that the current evidence satisfies a credential category.

## Defensive work description

The applicant may use the following three-sentence draft if it matches their actual responsibilities:

> I maintain the public http-privacy-guard component and am responsible for its security policy, vulnerability triage, regression checks, and release review. My defensive work covers this component and my own private member/document platform, focusing on private-response caching, browser-origin checks, and account/tenant access to private documents. I request Defense Access to assess these systems, reproduce potential vulnerabilities with synthetic data, and develop fixes.

This draft does not claim that the component has been deployed in the private platform. The applicant supplies their verified identity, confirms account requirements and submits their own application.
