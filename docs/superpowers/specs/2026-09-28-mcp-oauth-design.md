# MCP OAuth and database, phase 2

Phase 2 of the [MCP module](2026-09-24-mcp-module-design.md): the server answers over Streamable
HTTP in staging, behind OAuth, with its state in PostgreSQL. This document covers authentication,
authorization and storage. Deployment (image, container, proxy) stays in the module spec.

Decided on 28 September 2026. The design ports VizzHub's MCP OAuth
(`vizzhub/mcp_server/auth/`, `mcp` 1.29) to `mcp` 2.2 and avoids the defects found in it; each
one is listed under "Defects not carried over".

## Decisions

| # | Decision | Outcome |
|---|---|---|
| 1 | Who can connect | Anyone with a Google account whose verified email is on an allowlist: the table `mcp.allowed_emails`, managed with `amazonia360-mcp-db allow`, `revoke` and `list`. A change takes effect on the next request, without a restart. No domain restriction, so partners such as the IDB reviewers can connect. Until 30 September 2026 the allowlist was the `MCP_ALLOWED_EMAILS` variable, and each change needed a redeploy |
| 2 | Database | A schema `mcp` owned by its own role, inside the existing staging database. Replaces "a second database" in the module spec |
| 3 | Identity provider | Google, through a server-side authorization code exchange |
| 4 | Tokens | Opaque random tokens, stored as SHA-256 hashes. No JWT |
| 5 | Consent | A consent page after the Google login, before any code is issued |
| 6 | Libraries | SQLAlchemy, Alembic and asyncpg. Not on the Tech Radar; approved for this project on 28 September 2026 |

### Why a schema and not a second database

The module spec rejected a schema because it shared Payload's user. With a role of its own the
objection goes away. Payload's user owns the database, but owning a database gives no access to
the objects in a schema another role owns, and the RDS master user is not a superuser. Payload's
Drizzle migrations only read and write `public`. In PostgreSQL 18 (the RDS version) `PUBLIC`
holds only `USAGE` on `public`: the MCP role can see the names of Payload's tables but not read
or change them, and Payload's role has no privilege on `mcp`.

The infrastructure cost is about the same as a second database (a second generated password, the
role's variables in Beanstalk), with one database to back up. The cost accepted: restoring or
recreating the staging database takes the MCP's clients and tokens with it, which at worst makes
users reconnect Claude.

### Why no JWT and no Google library

An access token that is a database row can be revoked, and the allowlist can be checked on every
request against the current allowlist. The traffic of a staging MCP makes the lookup per
request irrelevant. With no JWT there is no signing key to manage and no JWT library to add.

Google's ID token is not needed either. The server exchanges Google's code at Google's token
endpoint over TLS and reads the user from the userinfo endpoint with the access token Google
returned, using `httpx`, which the MCP already depends on. `google-auth` is not added.

## Flow

```
Claude ──register──▶ /mcp/register            redirect URIs checked against the allowlist
Claude ──browser───▶ /mcp/authorize           pending authorization stored; cookie set
                     └─302─▶ Google            state = pending authorization id
Google ──browser───▶ /mcp/oauth/callback       code exchanged; userinfo read; checks
                     └─200── consent page      "Claude (claude.ai) asks to use … as <email>"
user   ──POST──────▶ /mcp/oauth/consent        CSRF token and cookie checked
                     └─302─▶ redirect_uri?code&state
Claude ──POST──────▶ /mcp/token                PKCE checked by the SDK; code used once
```

1. **Registration.** Dynamic client registration stays open, since Claude needs it. The provider's
   `register_client` raises `RegistrationError` (`invalid_redirect_uri`) unless every redirect URI
   is on the redirect allowlist:
   - `https://claude.ai/api/mcp/auth_callback` and `https://claude.com/api/mcp/auth_callback`;
   - `https://chatgpt.com/connector_platform_oauth_redirect`, ChatGPT's stable redirect. ChatGPT
     only uses it when the server identifies itself in the authorization response (RFC 9207, see
     step 4); otherwise it asks for a per-connection `https://chatgpt.com/connector/oauth/{id}`,
     which is not allowed;
   - `http://localhost` and `http://127.0.0.1` on any port and path, for Claude Desktop, Claude
     Code and the Gemini CLI.

   The list is configuration, so another client can be added without a release. Gemini is left
   for later: the Gemini CLI already fits the loopback entries, but Gemini Enterprise registers
   no client dynamically and needs one created by hand, which the provider does not support
   yet.
2. **Authorize.** The provider stores a *pending authorization* (client, redirect URI, PKCE
   challenge, scopes, resource, the client's `state`), valid for 10 minutes, and redirects to
   Google with `state` set to its id, `scope=openid email`, and `prompt=select_account`. The SDK
   can only answer `/authorize` with a redirect, so it sends the browser to `/mcp/oauth/start`,
   which sets the cookie (`__Host-mcp_auth`, the id's hash, `HttpOnly`, `Secure`, `SameSite=Lax`,
   path `/`) and redirects to Google. The callback then only completes in the browser that
   started the flow.
3. **Callback.** Checks, in this order, each failing with a plain error page and no redirect:
   - the pending authorization exists, has not expired, and matches the cookie;
   - Google's code exchanges successfully;
   - userinfo returns `email_verified: true`;
   - the lowercased email is on the email allowlist.

   The pending authorization then records the email and a CSRF token, and the page asks for
   consent.
4. **Consent.** The page names the client (`client_name`, escaped) and the host it will send the
   user back to, and shows the email. It is served with `Content-Security-Policy: default-src
   'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'` and
   `X-Frame-Options: DENY`. There is no `form-action`: Chromium applies it to the redirect that
   follows the form POST as well, which would block the 303 back to the client after consent; the
   page runs no script (`default-src 'none'`) and every value on it is escaped, so the omission is
   safe. "Allow" posts the CSRF token; the handler checks it and the cookie,
   deletes the pending authorization with `DELETE … RETURNING`, issues a code valid for 60
   seconds, and redirects to the client. "Cancel" redirects with `error=access_denied`. Both
   redirects carry `iss` set to the issuer, exactly as in the metadata (RFC 9207), and the
   metadata declares `authorization_response_iss_parameter_supported: true`. The SDK's own error
   redirects from `/mcp/authorize` (an unknown scope, for instance) do not carry `iss`; only the
   error case is affected.
5. **Token.** The SDK checks the client, the redirect URI and PKCE (S256). The provider exchanges
   the code with `DELETE … RETURNING`, so a code works once even under concurrent requests.

## Tokens

- **Access token:** 32 random bytes, valid for 1 hour.
- **Refresh token:** 32 random bytes, valid for 30 days, rotated on every use. Each token belongs
  to a *family* started by one consent. A refresh token that has already been used revokes its
  whole family, since only a stolen copy would be presented twice.
  A refresh is an `UPDATE … SET used_at = now() WHERE used_at IS NULL RETURNING`, so the row
  stays to recognise a second use until it expires.
- **Storage:** only the SHA-256 of each token and code is stored; a token is looked up by its hash.
- **Verification**, on every request: the hash exists, the token has not expired or been revoked,
  and its email is still on the allowlist, checked in the same query as the token lookup (a join
  on `mcp.allowed_emails`), with no cache. The same check runs on every refresh and at the
  callback. `amazonia360-mcp-db revoke` removes the email and deletes its tokens and codes, so
  access ends at once.
- **`AccessToken`:** `subject` is the email and `resource` is the MCP's public URL, with
  `validate_token_resource=True`, so the SDK refuses a token issued for another resource. The SDK
  binds each HTTP session to the `client_id` and `subject` that created it.
- **Revocation** deletes the family of the token presented, access or refresh.
- **Identity in tools** comes from the SDK's `get_access_token()` on each request. There is no
  context variable of our own. The call log records the email of each call.
- **Client secrets:** Claude registers as a public client (`token_endpoint_auth_method: none`,
  PKCE). A confidential client's secret is stored as the SDK returns it, because the SDK compares
  it against `client_info`.

## Storage

Schema `mcp`, Alembic migrations, `version_table_schema="mcp"`:

| Table | Holds | Expires |
|---|---|---|
| `clients` | `client_id`, the registered `client_info` (JSONB), `created_at` | never; cleared by hand |
| `pending_authorizations` | id hash, client, redirect URI, PKCE challenge, scopes, resource, client state, email and CSRF token once Google returns | 10 minutes |
| `codes` | code hash, client, redirect URI, PKCE challenge, scopes, resource, email | 60 seconds |
| `tokens` | token hash, kind (access or refresh), family, client, email, scopes, resource, `used_at`, `expires_at` | 1 hour or 30 days |
| `allowed_emails` | email (primary key, stripped and lowercased), `added_by`, `added_at` | never; `amazonia360-mcp-db revoke` |

A background task started in the server's lifespan deletes expired rows every hour. No table
refers to Payload's tables.

Staging provisioning, idempotent, from `.ebextensions/database-provisioning.config`:

```sql
CREATE ROLE mcp LOGIN PASSWORD '…';
CREATE SCHEMA IF NOT EXISTS mcp AUTHORIZATION mcp;
ALTER ROLE mcp SET search_path = mcp;
```

Locally, the root `docker-compose.yml` database gets the same role and schema through an init
script.

## Transport

- Stdio stays unauthenticated, for local use. Streamable HTTP always requires a token.
- `streamable_http_path="/"`, and `/mcp` without a trailing slash is accepted, since Claude
  Desktop strips it.
- `TransportSecuritySettings(allowed_hosts=[…])` with the public host, or every request behind the
  load balancer is refused.
- Issuer and resource are `https://staging.amazoniaforever360.org/mcp`. The discovery documents
  are served at the domain root, as RFC 8414 and RFC 9728 place them for an issuer with a path:
  `/.well-known/oauth-authorization-server/mcp` and `/.well-known/oauth-protected-resource/mcp`.
  nginx routes both to the MCP. A redirect does not work; the SDK's client does not follow it.
- The session manager runs in the parent application's lifespan.
- nginx `limit_req` on `/mcp/register`, `/mcp/authorize` and `/mcp/oauth/`.

## Configuration

| Variable | Holds |
|---|---|
| `MCP_PUBLIC_URL` | `https://staging.amazoniaforever360.org/mcp` |
| `MCP_DATABASE_URL` | the `mcp` role's connection string |
| `MCP_GOOGLE_CLIENT_ID`, `MCP_GOOGLE_CLIENT_SECRET` | a Google OAuth client of its own, with redirect `…/mcp/oauth/callback` |
| `MCP_ALLOWED_REDIRECT_URIS` | the redirect allowlist, with the defaults above |

The server refuses to start over HTTP when any of these is missing, except
`MCP_ALLOWED_REDIRECT_URIS`, which has defaults. The email allowlist is not configuration: it is
the `mcp.allowed_emails` table. With the table empty the server still starts, and logs that
nobody can sign in. A leftover `MCP_ALLOWED_EMAILS` is ignored, with a warning at startup.

Needed from outside the repository: the Google OAuth client, in a Vizzuality Google Cloud project,
and the first emails, added with `amazonia360-mcp-db allow` after the migration.

## Defects not carried over

Found in VizzHub on 28 September 2026 (commit `4234c652`) and reported to its maintainer; no
tickets opened from here.

| VizzHub | Here |
|---|---|
| Open registration with any redirect URI and no consent: a registered client receives the code of anyone who follows its link | Redirect allowlist, and a consent page |
| A deactivated user keeps access by refreshing, indefinitely | The allowlist is checked on every request and every refresh |
| The ID token's `email_verified` and `hd` are not checked | `email_verified` is required; there is no domain to check |
| Code and refresh token read then deleted: two concurrent requests both succeed | `DELETE … RETURNING` |
| Identity set in a context variable by the auth middleware, possibly fixed for the whole session | `get_access_token()` per request; sessions bound to their owner by the SDK |
| The pre-callback row can be loaded as a code, and its exchange fails with a 500 | Pending authorizations are a separate table |
| Revoking an access token does nothing | Revocation deletes the token's family |
| `resource` stored but not validated | `validate_token_resource=True` |

## Testing

Ported from VizzHub where they apply (provider, transport), plus one test per defect above:

- a redirect URI off the allowlist is refused at registration;
- an unverified email, and an email off the allowlist, are refused at the callback;
- a callback without the cookie, or with another browser's cookie, is refused;
- a consent post without the CSRF token is refused;
- a code works once, also under two concurrent exchanges;
- a reused refresh token revokes its family;
- an email removed from the allowlist loses access on the next request and on refresh, and
  `revoke` deletes its tokens;
- a token cannot use a session another token created;
- a token issued for another resource is refused.
- the consent redirects, Allow and Cancel, carry `iss` equal to the metadata's `issuer`.

Database tests run against a real PostgreSQL (the local Compose database). Google is faked at the
HTTP level.
