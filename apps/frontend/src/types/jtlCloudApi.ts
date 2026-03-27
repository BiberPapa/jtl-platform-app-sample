/**
 * Types for JTL Cloud Platform APIs
 * Used for OAuth functionality with Bearer Token authentication
 */

// Tenant Management
export type Tenant = {
  id: string;
  name: string;
  slug: string;
  kid: string;
  ownerId: string;
  defaultUISetting: {
    contentLanguage: string;
  };
  createdAt: string;
  updatedAt: string;
};

// ERP Instance Status
export type ErpInstanceStatus = {
  tenantId: string;
  product: 'erp-api';
  instanceId: string;
  metadata: {
    connected: boolean;
    lastSeen: string;
    lastConnection: string;
    lastConnectionVersion: string;
    lastConnectedApiVersion: string;
  };
};

// User Settings
export type UserSettings = {
  id: string;
  theme: 'light' | 'dark' | 'system';
  applicationLanguage: string;
  userTimezone: string;
  notationCurrency: string;
  printer: string;
};

// Session Information
export type AuthenticationMethod = {
  method: string;
  aal: string;
  completed_at: string;
};

export type VerifiableAddress = {
  id: string;
  value: string;
  verified: boolean;
  via: string;
  status: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
};

export type RecoveryAddress = {
  id: string;
  value: string;
  via: string;
  created_at: string;
  updated_at: string;
};

export type Identity = {
  id: string;
  schema_id: string;
  schema_url: string;
  state: 'active' | 'inactive';
  state_changed_at: string;
  traits: {
    email: string;
    name: {
      first: string;
      last: string;
    };
  };
  verifiable_addresses: VerifiableAddress[];
  recovery_addresses: RecoveryAddress[];
  metadata_public: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  organization_id: string | null;
};

export type Device = {
  id: string;
  ip_address: string;
  user_agent: string;
  location: string;
};

export type Session = {
  id: string;
  active: boolean;
  expires_at: string;
  authenticated_at: string;
  authenticator_assurance_level: string;
  authentication_methods: AuthenticationMethod[];
  issued_at: string;
  identity: Identity;
  devices: Device[];
};
