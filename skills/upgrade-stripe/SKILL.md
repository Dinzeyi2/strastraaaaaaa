---
name: upgrade-stripe
description: "Walks through upgrading Stripe API versions (e.g. 2024-12-18.acacia → 2026-04-22.dahlia), server-side SDKs (stripe-node, stripe-python, stripe-ruby, stripe-go, stripe-java, stripe-dotnet), Stripe.js major versions, and mobile SDKs (iOS, Android, React Native). Covers resolving breaking changes from the API changelog, migrating deprecated parameters and endpoints, updating webhook handlers for new event structures, and pinning explicit API versions in client initialization. Use when upgrading Stripe, handling Stripe deprecation warnings, migrating between Stripe API versions, updating Stripe SDK dependencies, resolving breaking changes after a Stripe update, or moving from legacy Stripe.js v3 to a named release."

---

Latest Stripe API version: **2026-04-22.dahlia**. Always use this version when upgrading unless the user specifies a different target.

## API Versioning

Review the [API Changelog](https://docs.stripe.com/changelog.md) for breaking changes between your current and target versions before upgrading. Version format: `YYYY-MM-DD.codename` (e.g., `2026-04-22.dahlia`).

## Server-Side SDK Versioning

See [SDK Version Management](https://docs.stripe.com/sdks/set-version.md) for details.

### Dynamically-Typed Languages (Ruby, Python, PHP, Node.js)

These SDKs offer flexible version control:

**Global Configuration:**

```python
import stripe
stripe.api_version = '2026-04-22.dahlia'
```

```ruby
Stripe.api_version = '2026-04-22.dahlia'
```

```javascript
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2026-04-22.dahlia'
});
```

**Per-Request Override:**

```python
stripe.Customer.create(
  email="customer@example.com",
  stripe_version='2026-04-22.dahlia'
)
```

### Strongly-Typed Languages (Java, Go, .NET)

These use a fixed API version matching the SDK release date. Don’t set a different API version for strongly-typed languages because response objects might not match the strong types in the SDK. Instead, update the SDK to target a new API version.

Always pin the API version explicitly in code rather than relying on the account default.

## Stripe.js Versioning

See [Stripe.js Versioning](https://docs.stripe.com/sdks/stripejs-versioning.md) for details.

Stripe.js uses an evergreen model with major releases (Acacia, Basil, Clover, Dahlia) on a biannual basis.

### Loading Versioned Stripe.js

**Via Script Tag:**

```html
<script src="https://js.stripe.com/dahlia/stripe.js"></script>
```

**Via npm:**

```bash
npm install @stripe/stripe-js
```

Major npm versions correspond to specific Stripe.js versions.

### API Version Pairing

Each Stripe.js version automatically pairs with its corresponding API version. For instance:

- Dahlia Stripe.js uses `2026-04-22.dahlia` API
- Acacia Stripe.js uses `2024-12-18.acacia` API

You can’t override this association.

### Migrating from v3

1. Identify your current API version in code
1. Review the changelog for relevant changes
1. Consider gradually updating your API version before switching Stripe.js versions
1. Stripe continues supporting v3 indefinitely

## Mobile SDK Versioning

See [Mobile SDK Versioning](https://docs.stripe.com/sdks/mobile-sdk-versioning.md) for details.

iOS and Android SDKs follow semver. New features and fixes release only on the latest major version — upgrade regularly.

React Native SDK uses 0.x.y schema where minor (x) bumps contain breaking changes.

All mobile SDKs work with any Stripe API version on the backend unless documentation specifies otherwise.

## Upgrade Checklist

1. Review the [API Changelog](https://docs.stripe.com/changelog.md) for breaking changes between your current and target versions
2. Check the [Upgrades Guide](https://docs.stripe.com/upgrades.md) for migration guidance
3. Update server-side SDK package version (e.g., `npm update stripe`, `pip install --upgrade stripe`)
4. Update the `apiVersion` parameter in your Stripe client initialization
5. Test your integration against the new API version using the `Stripe-Version` header — verify all API calls succeed and response shapes match expectations before committing. If a call fails, check the changelog for that specific breaking change and fix before proceeding.
6. Update webhook handlers to handle new event structures — test with `stripe trigger` or replay recent events to confirm handlers parse correctly
7. Update Stripe.js script tag or npm package version if needed
8. Update mobile SDK versions in your package manager if needed
9. Ensure database columns storing Stripe object IDs accommodate up to 255 characters (case-sensitive collation)
10. **Rollback plan**: If issues surface post-deploy, revert `apiVersion` to the previous version — Stripe supports multiple versions simultaneously

## Testing API Version Changes

Use the `Stripe-Version` header to test your code against a new version without changing your default:

```bash
curl https://api.stripe.com/v1/customers \
  -u sk_test_xxx: \
  -H "Stripe-Version: 2026-04-22.dahlia"
```

Or in code:

```javascript
const stripe = require('stripe')('sk_test_xxx', {
  apiVersion: '2026-04-22.dahlia'  // Test with new version
});
```

Breaking changes are tagged by product area (Payments, Billing, Connect, etc.) — filter the changelog to the relevant areas for the user's integration.
