# Security policy

## Supported version

Security fixes target the current `main` branch and the deployed production
version. Older tags and retained rollback artifacts are not maintained as
separate supported release lines.

## Reporting a vulnerability

Please report vulnerabilities privately through this repository's **Security**
tab using **Report a vulnerability**. If private reporting is unavailable,
contact the repository owner privately. Do not include secrets, personal data,
or exploitable details in a public issue.

Include the affected URL/component, reproduction steps, impact, and any safe
proof of concept. Do not access other users' data, disrupt production, or use
automated testing that creates significant traffic. The maintainer will confirm
receipt and coordinate disclosure after a fix; no fixed response SLA is
promised for this personal project.

## Security model

- The browser's Supabase publishable key is public by design. Row Level Security
  permits public reads and limits quantity updates to a private UUID allowlist.
- Service-role/secret keys belong only in local environment variables or GitHub
  secrets. Never commit them, put them under `public/`, or print them in logs.
- A strict CSP and safe DOM/image helpers limit injection. Remote and database
  content must always be treated as untrusted.
- GitHub Actions use pinned action SHAs, narrow job permissions, CodeQL,
  dependency review, and protected required checks.
- Releases are tied to a tested deployed SHA and include checksums, an SPDX SBOM,
  and build-provenance attestations verified before publication.

Suspected credential exposure should be handled as an incident: revoke/rotate
the credential first, then remove exposure, audit logs and history, and document
the remediation without republishing the secret.

