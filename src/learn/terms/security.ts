import type { Term } from '../glossary';

/** Words the security lessons explain. */
export const securityTerms: Term[] = [
	{
		id: 'authentication',
		term: 'Authentication',
		meaning:
			'Proving who you are: with a password, a code, a passkey, or by signing in at another company like Google. Often shortened to authn.',
		like: 'Showing your ID card at the door.',
		forms: ['authentication', 'authenticate', 'authenticated'],
	},
	{
		id: 'authorization',
		term: 'Authorization',
		meaning:
			'Deciding what someone who has proved who they are may do: which orders they may see, and what they may change. Often shortened to authz.',
		like: 'Which doors your ID card opens: staff rooms for staff, not for visitors.',
		forms: ['authorization', 'authorisation'],
	},
	{
		id: 'password-hash',
		term: 'Password hash',
		meaning:
			'What a site keeps instead of your password: a value worked out from it that can’t be turned back. A login is checked by working it out again and comparing. It’s made slow on purpose, with Argon2id, scrypt or bcrypt.',
		forms: ['password hash', 'password hashes', 'slow hash', 'slow hashes'],
	},
	{
		id: 'salt',
		term: 'Salt',
		meaning:
			'A random value mixed into each password before it’s hashed, and kept beside the result. Two people with the same password get different results, so one guess can’t crack both.',
		forms: ['salt', 'salted'],
	},
	{
		id: 'plain-text',
		term: 'Plain text',
		meaning:
			'Data kept or sent as it is, readable by anyone who sees it: not hashed, and not encrypted.',
		forms: ['plain text'],
	},
	{
		id: 'cryptographic-hash',
		term: 'Cryptographic hash',
		meaning:
			'A function that turns any data into a short value of fixed size. The same data always gives the same value, the smallest change gives a completely different one, and it can’t be turned back. SHA-256 is one.',
		forms: ['cryptographic hash', 'cryptographic hashes', 'sha-256'],
	},
	{
		id: 'credential-stuffing',
		term: 'Credential stuffing',
		meaning:
			'Trying emails and passwords leaked from one site on many others, with a bot, betting that people reused them.',
		forms: ['credential stuffing'],
	},
	{
		id: 'mfa',
		term: 'Multi-factor authentication (MFA)',
		meaning:
			'Asking for a second proof as well as the password: a code from an app, a security key or a passkey. A stolen password alone is no longer enough.',
		like: 'A bank locker that needs your key and the bank’s key together.',
		forms: ['multi-factor authentication', 'mfa', 'second proof'],
	},
	{
		id: 'passkey',
		term: 'Passkey',
		meaning:
			'A way to sign in with no password: a private key kept on your phone or in your password manager, unlocked with your fingerprint or PIN. The site keeps only the matching public key, and the passkey only works on the real site, so a fake one can’t steal it.',
		forms: ['passkey', 'passkeys'],
	},
	{
		id: 'jwt',
		term: 'JWT (JSON Web Token)',
		meaning:
			'A token that says who someone is and until when, signed by whoever made it. Any server with the right key can check it without looking anything up, and anyone holding it can read what’s inside.',
		like: 'A signed, dated pass: the guard checks the signature, not a list.',
		forms: ['jwt', 'jwts', 'json web token', 'json web tokens'],
	},
	{
		id: 'access-token',
		term: 'Access token',
		meaning:
			'A short-lived token sent with every request, to show who is asking and what they may do.',
		forms: ['access token', 'access tokens'],
	},
	{
		id: 'local-storage',
		term: 'localStorage',
		meaning:
			'A place in the browser where a site’s scripts can keep data between visits. Any script on the page can read it, including one an attacker managed to slip in.',
		forms: ['localstorage'],
	},
	{
		id: 'refresh-token',
		term: 'Refresh token',
		meaning:
			'A longer-lived token, only ever sent to the login service, to get new access tokens. The service can refuse it once it’s been taken back.',
		forms: ['refresh token', 'refresh tokens'],
	},
	{
		id: 'signature',
		term: 'Signature',
		meaning:
			'A seal worked out from a message and a secret key. Anyone with the matching key can check that the message came from the key’s owner, and wasn’t changed.',
		like: 'A wax seal on a letter.',
		forms: ['signature', 'signatures'],
	},
	{
		id: 'public-key',
		term: 'Public and private keys',
		meaning:
			'A matched pair of keys. The private key is kept secret, and signs; anyone with the public key can check the signature, but can’t make one. So the public key can be shared with anyone.',
		like: 'A seal only you own, and a picture of it anyone can compare against.',
		forms: ['public key', 'public keys', 'private key', 'private keys'],
	},
	{
		id: 'oauth',
		term: 'OAuth 2.0',
		meaning:
			'A standard way to let one app act for you at another, with only the access you agreed to, and without giving it your password.',
		like: 'A valet key: it starts the car, but doesn’t open the boot.',
		forms: ['oauth', 'oauth 2.0'],
	},
	{
		id: 'openid-connect',
		term: 'OpenID Connect',
		meaning:
			'A standard built on OAuth 2.0 for signing in with another company’s account. It adds an ID token saying who you are. “Log in with Google” uses it.',
		forms: ['openid connect', 'oidc'],
	},
	{
		id: 'id-token',
		term: 'ID token',
		meaning:
			'A signed token from a sign-in provider like Google, saying who someone is: their id, name and email.',
		forms: ['id token', 'id tokens'],
	},
	{
		id: 'sso',
		term: 'Single sign-on',
		meaning:
			'Signing in once, with one account, to get into many apps that all trust it. Common for staff at work.',
		forms: ['single sign-on', 'sso'],
	},
	{
		id: 'saml',
		term: 'SAML',
		meaning:
			'An older standard for single sign-on, common at work: the company’s identity provider sends each app a signed message saying who someone is.',
		forms: ['saml'],
	},
	{
		id: 'identity-provider',
		term: 'Identity provider',
		meaning:
			'The service that signs people in for other apps, like Google, Okta or Microsoft Entra ID.',
		forms: ['identity provider', 'identity providers'],
	},
	{
		id: 'zero-trust',
		term: 'Zero trust',
		meaning:
			'Trusting no request just because it comes from inside the network. Every call has to prove who it’s from.',
		forms: ['zero trust'],
	},
	{
		id: 'idor',
		term: 'IDOR',
		meaning:
			'Short for insecure direct object reference: a hole where an app trusts the id in a request, so changing /orders/5521 to /orders/5522 shows someone else’s order. OWASP’s list of API risks calls it broken object level authorization, BOLA.',
		forms: [
			'insecure direct object reference',
			'insecure direct object references',
			'idor',
			'broken object level authorization',
			'bola',
		],
	},
	{
		id: 'owasp',
		term: 'OWASP',
		meaning:
			'A non-profit community that publishes free guides to web security, including lists of the most serious risks.',
		forms: ['owasp'],
	},
	{
		id: 'rbac',
		term: 'Role-based access control (RBAC)',
		meaning: 'Giving permissions to roles, like packer or owner, and roles to people.',
		forms: ['role-based access control', 'rbac'],
	},
	{
		id: 'role-explosion',
		term: 'Role explosion',
		meaning:
			'Ending up with so many roles, each for a slightly different case, that nobody can keep track of them.',
		forms: ['role explosion'],
	},
	{
		id: 'abac',
		term: 'Attribute-based access control (ABAC)',
		meaning:
			'Rules written about details of the person, the thing and the moment, like “refunds over ₹10,000 need a manager”.',
		forms: ['attribute-based access control', 'abac'],
	},
	{
		id: 'rebac',
		term: 'Relationship-based access control (ReBAC)',
		meaning:
			'Rules about how people and things are connected: you may see a document if it’s shared with you, or with a team you’re in.',
		forms: ['relationship-based access control', 'rebac'],
	},
	{
		id: 'least-privilege',
		term: 'Least privilege',
		meaning:
			'Giving each person and program only the access it needs, so a mistake or a break-in can do less damage.',
		like: 'A cleaner’s key that opens the offices, but not the safe.',
		forms: ['least privilege'],
	},
	{
		id: 'scopes',
		term: 'Scopes',
		meaning:
			'The list of what an OAuth token allows, like reading orders but not cancelling them.',
		forms: ['scopes'],
	},
	{
		id: 'policy-engine',
		term: 'Policy engine',
		meaning:
			'A program that holds the rules about who may do what, and answers allow or deny for any service that asks.',
		forms: ['policy engine', 'policy engines'],
	},
	{
		id: 'opa',
		term: 'Open Policy Agent (OPA)',
		meaning:
			'A widely used open-source policy engine. Its rules are written in a language of its own, called Rego.',
		forms: ['open policy agent', 'opa'],
	},
	{
		id: 'fail-closed',
		term: 'Fail closed',
		meaning:
			'Saying no when a check can’t be made, rather than letting everyone through. Letting everyone through is failing open.',
		like: 'A door that stays locked when the power fails.',
		forms: [
			'fail closed',
			'fails closed',
			'failing closed',
			'fail open',
			'fails open',
			'failing open',
		],
	},
	{
		id: 'multi-tenant',
		term: 'Multi-tenant',
		meaning:
			'One system serving many customers, called tenants, from the same servers and databases, with each kept apart from the others.',
		like: 'A block of flats: shared walls and pipes, separate front doors.',
		forms: ['multi-tenant', 'multi-tenancy', 'tenant', 'tenants'],
	},
	{
		id: 'row-level-security',
		term: 'Row-level security',
		meaning:
			'A database feature that lets each query see only the rows it’s allowed to, like one seller’s orders, whatever the query asks for.',
		forms: ['row-level security'],
	},
	{
		id: 'encryption',
		term: 'Encryption',
		meaning:
			'Scrambling data with a key, so only someone with the key can turn it back. Turning it back is decrypting.',
		like: 'A locked box: anyone can carry it, but only the key opens it.',
		forms: [
			'encryption',
			'encrypt',
			'encrypts',
			'encrypted',
			'decrypt',
			'decrypts',
			'decrypted',
			'decrypting',
		],
	},
	{
		id: 'base64',
		term: 'Base64',
		meaning:
			'A way of writing any data as letters, digits and a couple of symbols, so it can travel inside text. Anyone can turn it back: it hides nothing.',
		forms: ['base64', 'base64 encoding'],
	},
	{
		id: 'hsts',
		term: 'HSTS',
		meaning:
			'A header that tells browsers to only ever use HTTPS for a site, so nobody can trick them into plain HTTP.',
		forms: ['hsts'],
	},
	{
		id: 'mutual-tls',
		term: 'Mutual TLS (mTLS)',
		meaning:
			'TLS where both sides show a certificate, so each knows exactly who it’s talking to. Used between services.',
		forms: ['mutual tls', 'mtls'],
	},
	{
		id: 'in-transit',
		term: 'Encryption in transit',
		meaning: 'Encrypting data while it travels between computers, with TLS.',
		forms: ['encryption in transit', 'in transit'],
	},
	{
		id: 'at-rest',
		term: 'Encryption at rest',
		meaning:
			'Encrypting data where it’s kept: disks, databases and backups. A stolen disk or backup is then useless.',
		forms: ['encryption at rest', 'encrypted at rest', 'at rest'],
	},
	{
		id: 'kms',
		term: 'Key management service (KMS)',
		meaning:
			'A cloud service that keeps encryption keys, like AWS KMS. Its main keys never leave it: data keys are sent to it to be locked or unlocked.',
		forms: ['key management service', 'kms'],
	},
	{
		id: 'hsm',
		term: 'Hardware security module',
		meaning:
			'A device built to keep keys and use them, without ever letting them out, and to resist anyone tampering with it.',
		forms: ['hardware security module', 'hardware security modules'],
	},
	{
		id: 'envelope-encryption',
		term: 'Envelope encryption',
		meaning:
			'Encrypting data with a data key of its own, then encrypting that data key with a main key kept in a KMS, and keeping the locked data key beside the data.',
		like: 'Locking a letter in a box, and keeping the box’s key in a bank vault.',
		forms: ['envelope encryption'],
	},
	{
		id: 'data-key',
		term: 'Data key',
		meaning:
			'The key that encrypts one piece of data. It’s kept beside the data, itself encrypted with a main key.',
		forms: ['data key', 'data keys'],
	},
	{
		id: 'secret',
		term: 'Secret',
		meaning:
			'A password or key a program needs, like the database password or an API key. Anyone who has it can act as the program.',
		forms: ['secret', 'secrets'],
	},
	{
		id: 'secrets-manager',
		term: 'Secrets manager',
		meaning:
			'A safe store for secrets, like HashiCorp Vault or AWS Secrets Manager. Each service gets only the secrets it’s allowed, and every fetch is logged.',
		forms: ['secrets manager', 'secrets managers'],
	},
	{
		id: 'rotation',
		term: 'Rotation',
		meaning:
			'Replacing a secret or key with a new one, on a schedule and after any leak, so an old one that leaked stops working.',
		forms: ['rotation', 'rotate', 'rotated'],
	},
	{
		id: 'api-key',
		term: 'API key',
		meaning:
			'A secret string a program sends to prove it may use an API, like the shop’s key for the payment provider.',
		forms: ['api key', 'api keys'],
	},
	{
		id: 'tokenisation',
		term: 'Tokenisation',
		meaning:
			'Keeping a stand-in token instead of the real thing, like a card number. The token only works for one shop, so it’s useless if stolen.',
		forms: ['tokenisation'],
	},
	{
		id: 'gdpr',
		term: 'GDPR',
		meaning:
			'The European Union’s law on personal data: what may be collected, why, for how long, and people’s right to see and delete what’s kept about them.',
		forms: ['gdpr'],
	},
	{
		id: 'csrf',
		term: 'Cross-site request forgery (CSRF)',
		meaning:
			'Another site making your browser send a request to a site you’re signed in to, like placing an order, without you knowing.',
		forms: ['cross-site request forgery', 'csrf'],
	},
	{
		id: 'end-to-end-encryption',
		term: 'End-to-end encryption',
		meaning:
			'Encryption where only the people talking hold the keys, so even the company running the servers can’t read the messages. WhatsApp and Signal work this way.',
		forms: ['end-to-end encryption', 'end-to-end encrypted'],
	},
];
