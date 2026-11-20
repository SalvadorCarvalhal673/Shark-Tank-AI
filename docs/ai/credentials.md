# Server configuration — #49
configuration.ts imports Node process, rejects browser execution, reads environment only when explicitly invoked, validates provider/model/mode and wraps the credential in a private field with redacted JSON/string serialization. Do not log/inspect the object or export credential.use results to clients. A capability protects accidental serialization, not malicious server code or memory inspection.

Default scripted; absent credentials yield scripted/missing-credentials when live mode requested. Unknown/mismatched models, malformed placeholders or NEXT_PUBLIC credential variables yield safe invalid-configuration without echoing input. Configured means validated configuration ONLY: no live adapter, endpoint or network request exists.

environment.example.txt is documentation, deliberately avoids shared .env examples/config files. Real keys belong in ignored .env.local/server secret manager after approval; never source, NEXT_PUBLIC, localStorage, fixtures or logs. Phase4D must add the Next server-only compiler boundary to its actual route imports and verify client bundles. No current UI imports this module. Tests use a clearly synthetic value, never a real key. No dependency installed.

SE-001 open. A configured secret is not permission to deploy or make a paid call. Public deployment prohibited.
