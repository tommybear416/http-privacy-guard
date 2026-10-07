# Security policy

## Supported versions

The latest 0.1.x source release is the initial supported series. No third-party audit or production security certification has been completed. Fixes will be reviewed and released by the maintainer; there is no guaranteed response time.

## Report a vulnerability

Use GitHub's private **Report a vulnerability** control on this repository's Security tab once private vulnerability reporting is enabled. If that control is unavailable, do not post exploit details or affected private records in a public issue. A reporting channel must be established with [tommybear416](https://github.com/tommybear416) before sending those details.

Provide an affected source commit/version, a synthetic reproduction, expected and observed behavior, and the affected control. Do not send real health/legal records, session cookies, credentials, member identities, private application exports or signing evidence. Public issues are appropriate for non-sensitive documentation questions and feature requests.

The maintainer will validate the report, assess the boundary and publish a fix/advisory when appropriate. Coordinate disclosure before publishing an exploit. The project does not grant authorization to test third-party systems or access another person's data.

## Integration responsibility

The application must authenticate sessions, load trusted ownership/tenant/grant state, authorize every relevant operation before a storage read, configure private storage and TLS, control logs and caches, and protect credentials. See [THREAT-MODEL.md](docs/THREAT-MODEL.md). A passing test suite does not verify those application controls.
