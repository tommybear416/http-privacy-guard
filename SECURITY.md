# Security policy

## Supported versions

| Version | Security status |
| --- | --- |
| 0.1.1 | Supported correction for the targeted CDN cache-header defect |
| 0.1.0 | Affected by GHSA-mjww-fjrv-p72m; upgrade to the reviewed 0.1.1 source |

See the [published advisory](https://github.com/tommybear416/http-privacy-guard/security/advisories/GHSA-mjww-fjrv-p72m) and [offline verification evidence](docs/VERIFICATION.md). Yitong Chen ([tommybear416](https://github.com/tommybear416)) owns security triage, correction and disclosure decisions. No third-party audit or production security certification has been completed. Maintenance occurs at the owner's instruction; there is no guaranteed response time.

## Report a vulnerability

Private vulnerability reporting is enabled for this repository. Use GitHub's private **Report a vulnerability** control from the [Security tab](https://github.com/tommybear416/http-privacy-guard/security). If that control is unavailable, do not post exploit details or affected private records in a public issue. A reporting channel must be established with [tommybear416](https://github.com/tommybear416) before sending those details.

Provide an affected source commit/version, a synthetic reproduction, expected and observed behavior, and the affected control. Do not send real health/legal records, session cookies, credentials, member identities, private application exports or signing evidence. Public issues are appropriate for non-sensitive documentation questions and feature requests.

The maintainer will validate the report, assess the boundary and publish a fix/advisory when appropriate. Coordinate disclosure before publishing an exploit. The project does not grant authorization to test third-party systems or access another person's data.

## Integration responsibility

The application must authenticate sessions, load trusted ownership/tenant/grant state, authorize every relevant operation before a storage read, configure private storage and TLS, control logs and caches, and protect credentials. See [THREAT-MODEL.md](docs/THREAT-MODEL.md). A passing test suite does not verify those application controls.
