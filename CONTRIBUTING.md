# Contributing

Use Node.js 22 or later. The project uses built-in Node tooling and has no package dependencies.

1. Run `npm ci --ignore-scripts` and `npm test`.
2. For a security fix, include a synthetic regression that demonstrates a denied or incorrectly allowed boundary before the fix. Explain the trusted inputs and integration impact.
3. Run `npm run test:coverage` and `npm run check:release`. Never include credentials, deployment settings or participant data.
4. Submit a pull request. Security-sensitive reports follow [SECURITY.md](SECURITY.md) first.

Changes to the runtime, security policy or public-resource exceptions require maintainer review. Do not enable automatic merges. Preserve deny-by-default behavior and document API changes. Test runners and Dependabot proposals are evidence for review, not release approval.

Before a release, the maintainer reviews the entire public file set, verifies tests and package contents, checks the MIT notice and declares the tested source commit. Pin downstream installations to that commit. There are no install hooks or registry publication credentials in CI. Publishing an npm package or deploying a downstream application is a separate action.
