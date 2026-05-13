# Setup and Security Guide

## Overview

This Cloud App is an **ERP-only plugin** for the JTL Cloud Platform. It integrates with the JTL Hub, OAuth 2.0, and the ERP API to provide functionality within the JTL ecosystem.

This guide explains how to set up the app securely from the start and references official JTL documentation for integration context.

## Prerequisites

Before starting, understand the official JTL Cloud Platform architecture:

- **[JTL Cloud Platform Overview](https://developer.jtl.cloud/docs)** – Overview of the JTL Cloud ecosystem, OAuth flows, and app integration
- **[App Shell Integration Guide](https://developer.jtl.cloud/docs/app-shell)** – How apps integrate with JTL Hub via AppBridge
- **[Authentication & Security](https://developer.jtl.cloud/docs/auth)** – OAuth 2.0 client credentials flow and session token validation
- **[ERP API Reference](https://developer.jtl.cloud/docs/erp-api)** – ERP endpoint structure, tenant context, and request/response formats

## Architecture Principles

### 1. ERP-Only Plugin Model

This app does **not** provide standalone functionality. It runs only within the JTL Hub and requires:

- **AppBridge session context** – The host platform (JTL Hub) must provide session tokens via AppBridge
- **Tenant context** – Session tokens carry tenant ID, extracted server-side for request routing
- **No fallbacks** – No local development workarounds or fallback credentials in production

### 2. Security Model

The app enforces **mandatory AppBridge integration**:

```
JTL Hub → AppBridge Session → Frontend → Backend
   ↓
   └─ getSessionToken() → X-Session-Token header
   └─ Backend validates & extracts tenant context
   └─ All ERP calls include tenant context
```

**Key constraints:**
- Frontend always provides `X-Session-Token` header
- Backend requires valid session token for all routes
- No environment-based fallbacks (e.g., `NOHUB_TENANT_ID`)
- Invalid tokens result in 400 Bad Request, never 500

### 3. Clean Setup

A clean setup means:

- ✅ Proper app registration in JTL Partner Portal with correct OAuth credentials
- ✅ Manifest file (`manifest.json`) properly configured with lifecycle and capability endpoints
- ✅ Frontend and backend always communicate with valid session tokens
- ✅ No deprecated code paths or fallback modes enabled
- ✅ Clear error messages when setup is incomplete

## Local Development Setup

### Step 1: Register the App (JTL Partner Portal)

Follow the [JTL App Registration guide](https://developer.jtl.cloud/docs/app-registration):

1. Log in to [JTL Partner Portal](https://partner.jtl.cloud)
2. Create a new app in **My Apps**
3. Set **App Type** to **ERP Plugin**
4. Configure OAuth:
   - **Client ID**: Copy to `apps/backend/.env`
   - **Client Secret**: Copy to `apps/backend/.env` (keep secure)
5. Set **Redirect URI**: `http://localhost:6142/setup` (for local dev)

### Step 2: Configure the App Manifest

Update `apps/frontend/manifest.json` to match your app:

```json
{
  "manifest": {
    "technicalName": "my-app-id",
    "version": "1.0.0",
    "requirements": {
      "minErpVersion": "1.0.0"
    },
    "lifecycle": {
      "configurationUrl": "/setup",
      "connectUrl": "/connect",
      "disconnectUrl": "/disconnect"
    }
  },
  "capabilities": {
    "erp": {
      "menuItems": [
        { "id": "Dashboard", "label": "Dashboard", "icon": "dashboard", "url": "/erp/menu/Dashboard" },
        { "id": "ApiDashboard", "label": "API Dashboard", "icon": "api", "url": "/erp/menu/ApiDashboard" }
      ],
      "pane": {
        "id": "orders",
        "label": "Orders",
        "url": "/erp/pane/orders"
      }
    }
  },
  "listing": {
    "de": {
      "name": "Mein App Name",
      "description": "Beschreibung"
    },
    "en": {
      "name": "My App Name",
      "description": "Description"
    }
  }
}
```

### Step 3: Set Environment Variables

Create `apps/backend/.env`:

```env
# OAuth Credentials (from JTL Partner Portal)
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# API Environment (dev/qa/prod, defaults to prod)
API_ENVIRONMENT=qa

# Logging (optional)
LOG_LEVEL=info
ERP_PROXY_LOG_LEVEL=basic
```

**Do NOT include:**
- ~~`NOHUB_TENANT_ID`~~ – No fallback credentials
- ~~`NOHUB_BRIDGE_FALLBACK`~~ – No dummy bridges in production
- ~~`LOCAL_DEV_TOKEN`~~ – No hardcoded tokens

### Step 4: Install and Run

```bash
# From repository root
corepack enable
pnpm install
pnpm dev
```

The app starts at:
- Backend: `http://localhost:6143`
- Frontend: `http://localhost:6142`

### Step 5: Test in JTL Hub

1. In JTL Hub, install your app via **Partner Portal** or by linking the development URL
2. Navigate to the app within the hub
3. The frontend should receive a valid AppBridge session token
4. AppBridge methods (`getSessionToken`, `setupCompleted`) should succeed
5. ERP proxy requests should include the `X-Session-Token` header

## Security Best Practices

### 1. Session Token Handling

**Frontend:**
- Always call `appBridgeClient.getSessionToken()` before making backend requests
- Never cache tokens across page reloads
- Treat tokens as opaque strings (don't parse or validate client-side)

**Backend:**
- Validate session tokens against JTL's JWKS endpoint
- Extract tenant ID from the session token (server-side only)
- All ERP requests must include tenant context
- Return 400 Bad Request if token is invalid, never use a fallback

### 2. Environment Variables

- **Never commit secrets** to version control
- Use `.env.local` or similar for local development
- In CI/CD, inject secrets via environment or secure vaults
- Rotate `CLIENT_SECRET` regularly

### 3. CORS and Headers

- Backend applies CORS headers (see `app.ts`)
- Frontend communicates via `X-Session-Token` header
- ERP proxy adds `X-Tenant-ID` header automatically
- No custom headers bypass session validation

### 4. Error Responses

Errors should be predictable and safe:

```typescript
// ✅ Correct: Explicit error code and status
{
  error: "Failed to execute GraphQL request",
  message: "The X-Session-Token header is required.",
  status: 400
}

// ❌ Avoid: Falling back to defaults
// Do not silently use NOHUB_TENANT_ID
// Do not skip validation
```

### 5. Logging

- Log request metadata (method, path, status, errors)
- Redact sensitive headers (`Authorization`, `X-Session-Token`)
- Log ERP proxy timing for diagnostics
- Use structured logging (JSON format)

## Deployment Checklist

Before deploying to production:

- [ ] App is registered in JTL Partner Portal with correct OAuth credentials
- [ ] `manifest.json` is updated with your app's technical name and capabilities
- [ ] `CLIENT_ID` and `CLIENT_SECRET` are set in production environment variables
- [ ] Session token validation is enabled and working
- [ ] All ERP requests include tenant context
- [ ] Error handling returns proper HTTP status codes (not 500 for validation errors)
- [ ] Logging redacts sensitive headers
- [ ] `ERP_PROXY_LOG_LEVEL` is set to `off` or `basic` in production
- [ ] HTTPS is enforced for all endpoints
- [ ] CORS allows only trusted origins

## Integration with JTL Hub

Once deployed, integrate the app with JTL Hub:

1. **In Partner Portal**: Update app listing with marketing info, screenshots, and support contact
2. **Set Redirect URIs**: Production URL (e.g., `https://myapp.com/setup`)
3. **Enable for Marketplace**: Submit for review if publishing to JTL Marketplace
4. **Test Flow**: 
   - JTL Hub → Click to install
   - Redirect to `/setup` with session token
   - Call `/connect` to validate connection
   - App appears in ERP menu/pane

See [JTL Hub Integration Guide](https://developer.jtl.cloud/docs/hub-integration) for details.

## Troubleshooting

### "AppBridge is not available" error

**Cause:** App is not running within JTL Hub (no session context).

**Fix:**
- Open app from JTL Hub menu, not directly via URL
- Check that AppBridge is properly initialized in `AppBootstrap.tsx`

### "X-Session-Token header is required" error

**Cause:** Frontend didn't send session token to backend.

**Fix:**
- Verify `appBridgeClient.getSessionToken()` returns a non-empty string
- Check that `requestBackend()` includes the token in headers
- Ensure AppBridge is initialized before making API calls

### "Invalid session token" error (from backend)

**Cause:** Session token failed JWKS validation.

**Fix:**
- Token may have expired; refresh from AppBridge
- Check that backend is using correct JWKS endpoint for the environment
- Verify `API_ENVIRONMENT` matches the token's issuer

### "Tenant context is required" error

**Cause:** Session token doesn't contain a valid tenant ID.

**Fix:**
- Ensure user is logged in to JTL Hub before opening app
- Check that user belongs to at least one tenant/business
- Verify session token validation extracted tenant ID correctly

## References

- [JTL Cloud Platform Documentation](https://developer.jtl.cloud/docs)
- [JTL App Registration Guide](https://developer.jtl.cloud/docs/app-registration)
- [JTL Hub Integration Guide](https://developer.jtl.cloud/docs/hub-integration)
- [OAuth 2.0 & Security](https://developer.jtl.cloud/docs/auth)
- [AppBridge Reference](https://developer.jtl.cloud/docs/app-bridge)
- [ERP API Reference](https://developer.jtl.cloud/docs/erp-api)

## Questions?

- Check [JTL Developer Portal](https://developer.jtl.cloud)
- Contact support at [support@jtl-software.com](mailto:support@jtl-software.com)
