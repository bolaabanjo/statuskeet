const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  service_type: string;
  url?: string;
  criticality: string;
  current_status: string;
  check_interval: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  org_id: string;
  title: string;
  status: string;
  severity: string;
  auto_generated: boolean;
  started_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  status: string;
  message: string;
  is_public: boolean;
  created_at: string;
}

export interface DailyUptime {
  date: string;
  uptime_rate: number;
  total: number;
}

export interface ServiceWithUptime extends Service {
  uptime: DailyUptime[];
}

export interface PublicIncidentResponse {
  incident: Incident;
  updates: IncidentUpdate[];
}

export interface PublicStatusResponse {
  organization: Organization;
  overall_status: string;
  status_message: string;
  services: ServiceWithUptime[];
  active_incidents: PublicIncidentResponse[];
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
  organization: Organization;
}

export async function getPublicStatus(slug: string): Promise<PublicStatusResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/public/${slug}/status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPublicIncidents(
  slug: string
): Promise<PublicIncidentResponse[]> {
  try {
    const res = await fetch(`${API_URL}/v1/public/${slug}/incidents`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.incidents;
  } catch {
    return [];
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function signup(
  name: string,
  email: string,
  password: string,
  orgName: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, org_name: orgName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Signup failed");
  }
  return res.json();
}

export interface OnboardingRequest {
  first_name: string;
  last_name: string;
  company_size: string;
  role: string;
  use_cases: string[];
}

export async function completeOnboarding(
  token: string,
  data: OnboardingRequest
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save onboarding");
  }
}

export async function getOnboardingStatus(
  token: string
): Promise<{ completed: boolean }> {
  const res = await fetch(`${API_URL}/v1/onboarding`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return { completed: false };
  return res.json();
}

export interface APIKey {
  id: string;
  organization_id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface CreateAPIKeyResponse {
  key: string;
  api_key: APIKey;
}

export async function createAPIKey(
  token: string,
  name: string
): Promise<CreateAPIKeyResponse> {
  const res = await fetch(`${API_URL}/v1/org/api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create API key");
  }
  return res.json();
}

export async function listAPIKeys(token: string): Promise<APIKey[]> {
  const res = await fetch(`${API_URL}/v1/org/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.api_keys || [];
}

export async function revokeAPIKey(
  token: string,
  keyId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/v1/org/api-keys/${keyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to revoke API key");
  }
}

export async function getServices(token: string): Promise<Service[]> {
  const res = await fetch(`${API_URL}/v1/services`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.services;
}

export interface CheckResult {
  id: string;
  service_id: string;
  source: string;
  status: string;
  response_time: number | null;
  status_code: number | null;
  error_message: string | null;
  region: string | null;
  checked_at: string;
}

export interface ServiceDetailResponse {
  service: Service;
  uptime: DailyUptime[] | null;
  recent_checks: CheckResult[] | null;
}

export async function getServiceDetail(
  token: string,
  serviceId: string
): Promise<ServiceDetailResponse | null> {
  const res = await fetch(`${API_URL}/v1/services/${serviceId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
