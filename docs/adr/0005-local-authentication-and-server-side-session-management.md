# ADR-0005: Local authentication and server-side session management

- Status: Accepted
- Date: 2026-08-12
- Deciders: Initial Rumpun Community maintainer
- Depends on: ADR-0002, ADR-0003, ADR-0004

## Context

Rumpun Community needs authentication for the initial single-family deployment. Members must be able to sign in, accept invitations, maintain sessions, sign out, recover access, and revoke compromised sessions. The system must distinguish authentication from authorization: authentication establishes an actor and session assurance, while Express and OPA decide whether that actor may perform a protected action.

The deployment is self-hosted and must not require a commercial identity provider, public internet connectivity, social login, or an email delivery service merely to function. At the same time, browser credentials must not be exposed to JavaScript or represented by long-lived bearer tokens in browser storage.

ADR-0002 selects Next.js as the frontend, Express as the canonical backend, and PostgreSQL as the authoritative store. ADR-0003 requires Express to provide trusted actor and session facts to OPA. ADR-0004 limits the initial deployment to one family tree but does not remove the need for explicit user identities, membership state, session revocation, or scope checks.

## Decision drivers

- Work in an ordinary self-hosted deployment without a mandatory external identity service.
- Keep authentication secrets and session authority out of Next.js client code.
- Support immediate session revocation and membership suspension.
- Avoid stateless bearer-token claims becoming stale authorization authority.
- Resist session fixation, hijacking, CSRF, credential stuffing, and account enumeration.
- Provide a safe bootstrap path for the first administrator.
- Keep account recovery possible without security questions or hidden maintainer access.
- Preserve a future path to passkeys or OpenID Connect without changing authorization semantics.
- Minimize personal data and never place genealogy data in credentials or session records.

## Options considered

### 1. Stateless JWT access and refresh tokens stored by the browser

**Advantages:** no session lookup on each request and familiar API tooling.

**Disadvantages:** revocation and privilege changes become harder, browser token storage increases theft exposure, refresh-token rotation adds substantial complexity, and claims can become stale authorization authority.

Rejected for the browser application. JWTs are not needed merely because the frontend and API are separate processes.

### 2. Mandatory OpenID Connect provider

**Advantages:** delegates credential handling, supports enterprise identity, and can provide stronger authentication capabilities.

**Disadvantages:** makes initial operation depend on additional infrastructure and configuration, complicates offline or small self-hosted installations, and can lock operators into provider-specific behavior.

Rejected as a mandatory dependency. Optional OpenID Connect integration requires a follow-up ADR.

### 3. Passwordless email links as the only authentication method

**Advantages:** no password database and simple user experience when reliable email exists.

**Disadvantages:** makes mailbox security and email delivery availability part of every sign-in, creates operational friction for self-hosters, and does not work reliably without configured SMTP.

Rejected as the sole method.

### 4. Local credentials with opaque server-side sessions

Express verifies local credentials, creates a random opaque session token, stores only its verifier and metadata in PostgreSQL, and sends the token in a hardened host-only cookie.

**Advantages:** self-contained operation, immediate revocation, small browser credential surface, no authorization claims in the cookie, and straightforward session inventory.

**Disadvantages:** requires secure password storage, a session lookup, CSRF protection, cleanup, rate limiting, and an explicit recovery process.

Accepted for the initial implementation.

## Decision

### Authentication boundary

Express is the sole authentication authority for the application. It owns credential verification, invitation acceptance, login, logout, recovery, session creation, rotation, validation, revocation, and authentication audit events.

Next.js renders authentication interfaces and calls the documented Express API. It must not verify passwords, mint sessions, store authentication bearer tokens in browser storage, or treat client-visible state as proof of identity.

PostgreSQL stores accounts, credential verifiers, invitations, recovery records, sessions, and security-relevant state. OPA does not verify credentials or sessions. After Express validates a session, it supplies the stable actor ID, membership state, and bounded session-assurance facts to authorization evaluation under ADR-0003.

### Initial identity and account model

Each account has a stable opaque identifier independent of email address, display name, genealogy person records, and membership role.

- Account identity and genealogy person identity are separate concepts. Linking them is optional and must never be required to authenticate.
- Email is the initial login identifier and invitation destination. It is normalized consistently for comparison while preserving the user-entered form for display where needed.
- Database uniqueness prevents two active accounts from using the same normalized email within a deployment.
- Display names are not login identifiers and need not be unique.
- Roles, permissions, and tree membership are not stored in the session cookie. They are loaded from authoritative server-side state.
- Disabled, deleted, suspended, or no-longer-invited accounts cannot create new sessions. Existing sessions are revoked when security-sensitive account or membership state requires it.

The initial release supports local email and password authentication. It does not support usernames, social login, LDAP, SAML, OpenID Connect, magic-link-only login, or passkeys unless a later ADR adds them.

### First-administrator bootstrap

A clean deployment starts without a usable account and exposes no permanent default credentials.

The operator creates the first administrator through a one-time, high-entropy bootstrap token generated outside the browser and delivered through the deployment's trusted operator channel, such as startup output or an explicit administrative command. The token:

- is valid only while no administrator exists
- has a short documented lifetime
- is stored only as a cryptographic verifier
- is consumed atomically with account creation
- becomes unusable after success
- is not accepted by ordinary login endpoints

Concurrent bootstrap attempts must produce at most one first administrator. Restarting the application must not silently create or reveal a new default password. Bootstrap secrets must not be committed to source control, container images, examples, or logs after consumption.

### Invitations

After bootstrap, new members enter through explicit invitations issued by an authorized member under ADR-0003.

Invitation tokens are random, single-use, time-limited, scoped to the intended normalized email and deployment tree, and stored only as verifiers. Accepting an invitation creates or activates the account and membership atomically. Replayed, expired, revoked, wrong-email, or already-consumed invitations fail without modifying membership.

An existing account accepting an invitation must authenticate before the invitation changes its membership. Invitations do not create authenticated browser sessions until account setup and required checks complete.

### Password handling

Passwords are transmitted only over HTTPS outside local development and are never logged, returned, emailed, or stored reversibly.

Use Argon2id with a unique random salt and parameters selected through a benchmark on supported deployment hardware. The baseline must follow then-current OWASP guidance and be recorded in configuration and tests. Parameters may increase over time; successful login rehashes an older verifier when necessary.

Password policy must:

- permit long passphrases and at least 64 characters
- set a reasonable minimum length, initially 12 characters
- accept Unicode and spaces without silent truncation
- avoid composition rules such as requiring arbitrary mixtures of symbols and capitalization
- reject passwords found in a locally usable compromised-password blocklist or privacy-preserving configured check when available
- allow password managers and paste
- avoid periodic forced changes unless compromise or policy migration requires one

All authentication responses and timings must be designed to reduce account enumeration. Rate limits apply per account identifier and source context with bounded, documented behavior. Rate limiting is defense in depth and must not become an unbounded denial-of-service primitive against a known account.

### Session token and storage

A successful login creates an opaque random token with at least 256 bits of cryptographically secure entropy. The raw token exists only in the browser cookie and transient request handling. PostgreSQL stores a keyed cryptographic verifier or hash of the token, never the raw token.

A session record contains only what is necessary to validate and manage the session, including:

- stable session ID distinct from the bearer token
- token verifier
- actor ID
- creation, last-seen, idle-expiry, and absolute-expiry timestamps
- authentication method and bounded assurance level
- credential or security-state version used at creation
- revocation timestamp and reason when revoked
- optional coarse client metadata needed for a user-visible session list and abuse investigation

Session records must not contain passwords, invitation tokens, genealogy content, full request bodies, or OPA decision input.

### Browser cookie

The browser session token is sent in a host-only cookie named `__Host-rumpun_session` with:

- `Secure`
- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- no `Domain` attribute

Supported production deployment requires HTTPS. A clearly isolated local-development mode may use a separate non-`__Host-` cookie over loopback HTTP; that exception must never activate from an untrusted forwarding header or ordinary production configuration.

The session token must not be copied into `localStorage`, `sessionStorage`, URLs, HTML, analytics events, client logs, or JavaScript-readable cookies. Cross-origin browser deployment is not supported initially. The supported reverse-proxy layout presents web and API endpoints as same-site resources and uses an explicit CORS allowlist that is closed by default.

### Session lifetime

Initial defaults are:

- idle timeout: 12 hours
- absolute lifetime: 7 days
- privileged reauthentication window: 15 minutes

Operators may shorten these values. Increasing them beyond documented safe maximums requires an explicit insecure-configuration warning and may be prohibited by validation.

Last-seen updates must be throttled to avoid a database write on every request without extending a session past either deadline. Expiry is enforced server-side; cookie expiry alone is not authority.

The session identifier rotates after login, password change, account recovery, privilege elevation, or another event that changes authentication assurance. Rotation atomically invalidates the replaced token. No pre-authentication session ID may survive into the authenticated session.

### Session validation

For every protected request, Express:

1. extracts the expected cookie only
2. verifies the opaque token against server-side state
3. rejects expired, revoked, unknown, malformed, or wrong-version sessions
4. verifies that the account and required membership remain active
5. derives actor and assurance facts from authoritative state
6. evaluates authorization through the ADR-0003 boundary

Invalid sessions fail closed and do not fall back to client claims. The application clears an invalid cookie where safe but does not reveal whether a token once represented a real session.

Session validation and authorization are distinct checks. A valid session does not grant access by itself.

### CSRF protection

Because authentication uses cookies, every state-changing browser request requires CSRF protection.

Express issues a cryptographically strong token bound to the authenticated session through a safe bootstrap response. Next.js or browser code returns it in a dedicated request header for unsafe methods. Express validates the binding before processing the operation.

The following are defense in depth, not substitutes for the session-bound token:

- `SameSite=Lax`
- strict Origin validation on unsafe requests
- Fetch Metadata checks where supported
- an explicit CORS allowlist
- rejection of simple cross-origin mutation content types where appropriate

`GET`, `HEAD`, and other safe methods must not perform state changes. Login, invitation acceptance, recovery, and logout receive explicit CSRF or login-CSRF treatment according to their pre-authentication state.

### Reauthentication and sensitive actions

Password changes, account recovery completion, changing the login email, revoking other sessions, exporting the full tree, and high-impact administration require recent authentication. OPA may require the `recent` assurance fact for additional actions.

Reauthentication creates or rotates a session with a bounded recent-authentication timestamp. It does not trust a timestamp supplied by the browser.

### Logout, revocation, and concurrent sessions

Logout revokes the current session server-side and clears the cookie. It is an authenticated, CSRF-protected state change and is idempotent.

Users can view a privacy-minimized list of their active sessions and revoke individual sessions or all other sessions. Administrators may revoke sessions only through explicit authorized operations with audit evidence.

Password change or recovery revokes all existing sessions except a newly established replacement session. Account suspension, deletion, or security-state invalidation revokes all sessions. Revocation must take effect on the next request and must not depend on cookie expiration.

The initial release permits multiple concurrent sessions per account but enforces a configurable finite limit. Creating a session beyond the limit revokes the oldest eligible session deterministically and informs the user without exposing raw metadata.

### Recovery

The project uses no security questions, universal recovery password, maintainer backdoor, or recoverable password encryption.

When email delivery is configured, password recovery uses a random, single-use, short-lived token stored only as a verifier. Responses do not reveal whether an account exists. Successful recovery atomically updates the password verifier, advances the account security version, consumes outstanding recovery tokens, and revokes prior sessions.

For deployments without email delivery, recovery is an explicit operator-assisted command executed through trusted host access. It creates a short-lived one-time recovery token or performs a documented account reset that is visible in the security audit trail. It must not print an existing password, silently create a permanent credential, bypass the one-family membership model, or modify genealogy data.

### Audit and privacy

Record bounded security events for bootstrap, invitation creation and consumption, login success and failure categories, logout, password change, recovery, session rotation, revocation, and account suspension.

Audit events may include event type, timestamp, request correlation ID, actor or target account ID where known, session ID (never token), coarse source metadata, outcome, and reason category. They must not include passwords, raw session or CSRF tokens, invitation or recovery tokens, full email contents, genealogy data, or complete request bodies.

User-visible errors stay generic where specificity would enable enumeration. Operator logs may contain a bounded internal reason code but not authentication secrets.

### Service-to-service authentication

This ADR covers human browser sessions. OPA, PostgreSQL, administrative commands, background jobs, and future integrations use separate least-privilege service identities and credentials. They must not reuse a human session cookie or receive an implicit authorization bypass.

## Consequences

### Positive

- The initial deployment authenticates users without mandatory external identity infrastructure.
- Opaque sessions are immediately revocable and contain no stale role claims.
- Browser JavaScript cannot read the session credential.
- Account, genealogy identity, membership, authentication, and authorization remain separate concepts.
- Session inventory, revocation, recovery, and security-state changes have explicit semantics.

### Negative

- The API performs a server-side session lookup for protected requests.
- Operators must secure HTTPS, secrets, PostgreSQL, bootstrap output, and recovery commands.
- The application must implement password hashing, CSRF protection, cleanup, rate limiting, and secure recovery correctly.
- Mandatory local credentials do not initially provide passkeys, federation, or enterprise SSO.
- Same-site deployment is the supported browser topology initially.

### Risks and mitigations

- **Session theft:** use HTTPS, `Secure`, `HttpOnly`, host-only cookies, bounded lifetimes, rotation, revocation, and user-visible session management.
- **Session fixation:** never promote a pre-authentication session; mint and rotate atomically after authentication.
- **CSRF:** require a session-bound token on unsafe methods plus Origin, Fetch Metadata, SameSite, and CORS defenses.
- **Credential stuffing:** use rate limits, generic errors, compromised-password checks, strong hashing, and auditable failure categories.
- **Stale permissions:** store no roles in the cookie and load current membership before OPA evaluation.
- **Database leak reveals active sessions:** store only session-token verifiers and keep the server-side pepper or key outside PostgreSQL where used.
- **Recovery becomes a backdoor:** use one-time expiring recovery, trusted host access, session revocation, and audit evidence.
- **Self-hosted HTTP weakens production security:** require HTTPS outside isolated loopback development and fail startup on unsafe cookie configuration.
- **Account is confused with a person in the tree:** keep stable IDs and lifecycle rules separate and test unlinked accounts.

### Migration implications

There is no existing application authentication system to migrate at the time of this proposal. Initial implementation must add reviewed PostgreSQL migrations for accounts, local credentials, invitations, recovery records, sessions, and bounded security events.

Schema and code must support credential-parameter upgrades, session cleanup, security-state versioning, and future authentication methods without changing stable account IDs or OPA actor IDs.

## Deferred decisions

This ADR does not select:

- an optional OpenID Connect provider
- passkey or WebAuthn enrollment and recovery
- multi-factor authentication
- LDAP or SAML integration
- native mobile token handling
- public third-party API credentials
- exact email delivery implementation
- device attestation or risk-scoring services

Each added authentication method requires threat modeling, account-linking rules, recovery behavior, session-assurance mapping, and downgrade-resistance tests.

## Validation

Before acceptance, reviewers must compare the design with current OWASP authentication and session-management guidance and verify that it remains practical for self-hosting.

Validate the decision with synthetic automated tests that:

1. create exactly one first administrator with concurrent bootstrap attempts
2. reject reused, expired, malformed, and post-bootstrap bootstrap tokens
3. hash passwords with the configured Argon2id parameters and upgrade an older verifier on login
4. return indistinguishable public behavior for unknown accounts and wrong passwords
5. create a session with a random opaque cookie while PostgreSQL stores no raw token
6. reject fixation by replacing all pre-authentication state at login
7. reject expired, idle, revoked, unknown, malformed, and wrong-security-version sessions
8. enforce cookie attributes in supported production mode and refuse unsafe production HTTP configuration
9. reject state-changing requests with missing, wrong-session, replay-incompatible, or cross-origin CSRF context
10. rotate sessions after password change, recovery, and recent-authentication elevation
11. revoke current, selected, other, and all sessions with effect on the next request
12. revoke sessions when the account or membership is suspended
13. keep roles and permissions out of cookies and re-evaluate current membership through OPA
14. accept an invitation once and reject replay, wrong email, expiry, and concurrent double consumption
15. recover an account through email-token and operator-assisted test adapters without a backdoor
16. verify logs and audit records contain no passwords, raw tokens, CSRF secrets, or genealogy content
17. keep account identity separate from genealogy person records
18. enforce idle, absolute, recent-authentication, and concurrent-session limits deterministically

Revisit this ADR when passkeys or federation become a validated community requirement, the supported browser topology changes, a native client is introduced, or operational evidence shows that the server-side session design cannot meet agreed reliability targets. Any replacement must include session migration or forced reauthentication, revocation semantics, downgrade resistance, and equivalent security tests.
