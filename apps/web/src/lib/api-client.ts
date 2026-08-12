import type {
  Health,
  Readiness,
  BootstrapStatus,
  BootstrapAdminRequest,
  AuthenticatedSession,
  CsrfToken,
  LoginRequest,
  CurrentAccount,
  ReauthenticateRequest,
  ChangePasswordRequest,
  RecoveryRequest,
  RecoveryCompleteRequest,
  Tree,
  UpdateTreeRequest,
  Person,
  CreatePersonRequest,
  UpdatePersonRequest,
  PeoplePage,
  Relationship,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  RelationshipsPage,
  Source,
  CreateSourceRequest,
  UpdateSourceRequest,
  SourcesPage,
  Citation,
  CreateCitationRequest,
  DeletionStatus,
  Problem,
  ValidationProblem,
  Invitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
} from "@/types/api";

const BASE_URL = "/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    public problem: Problem,
  ) {
    super(problem.title);
    this.name = "ApiError";
  }
}

class ApiValidationError extends ApiError {
  constructor(
    status: number,
    public validationProblem: ValidationProblem,
  ) {
    super(status, validationProblem);
    this.name = "ApiValidationError";
  }
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
    csrfToken?: string;
    idempotencyKey?: string;
    ifMatch?: string;
    signal?: AbortSignal;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...options?.headers,
  };

  if (options?.csrfToken) {
    headers["X-CSRF-Token"] = options.csrfToken;
  }
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  if (options?.ifMatch) {
    headers["If-Match"] = options.ifMatch;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    signal: options?.signal,
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/problem+json")) {
      const problem = (await res.json()) as Problem | ValidationProblem;
      if ("errors" in problem) {
        throw new ApiValidationError(res.status, problem as ValidationProblem);
      }
      throw new ApiError(res.status, problem);
    }
    throw new ApiError(res.status, {
      type: "about:blank",
      title: res.statusText,
      status: res.status,
      code: "unknown_error",
      requestId: "",
    });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function idempotencyKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~";
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export const api = {
  // System
  getLiveness(signal?: AbortSignal): Promise<Health> {
    return request<Health>("GET", "/health/live", { signal });
  },

  getReadiness(signal?: AbortSignal): Promise<Readiness> {
    return request<Readiness>("GET", "/health/ready", { signal });
  },

  // Bootstrap
  getBootstrapStatus(signal?: AbortSignal): Promise<BootstrapStatus> {
    return request<BootstrapStatus>("GET", "/bootstrap/status", { signal });
  },

  async createFirstAdministrator(
    req: BootstrapAdminRequest,
  ): Promise<AuthenticatedSession> {
    const csrf = await this.getCsrfToken();
    return request<AuthenticatedSession>("POST", "/bootstrap/admin", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  // Auth
  async getCsrfToken(signal?: AbortSignal): Promise<CsrfToken> {
    return request<CsrfToken>("GET", "/auth/csrf", { signal });
  },

  async login(req: LoginRequest): Promise<AuthenticatedSession> {
    const csrf = await this.getCsrfToken();
    return request<AuthenticatedSession>("POST", "/auth/login", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  async logout(): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("POST", "/auth/logout", { csrfToken: csrf.token });
  },

  getCurrentAccount(signal?: AbortSignal): Promise<CurrentAccount> {
    return request<CurrentAccount>("GET", "/auth/me", { signal });
  },

  async reauthenticate(req: ReauthenticateRequest): Promise<AuthenticatedSession> {
    const csrf = await this.getCsrfToken();
    return request<AuthenticatedSession>("POST", "/auth/reauthenticate", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  async changePassword(req: ChangePasswordRequest): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("PUT", "/auth/password", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  async requestPasswordRecovery(req: RecoveryRequest): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("POST", "/auth/recovery/request", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  async completePasswordRecovery(
    req: RecoveryCompleteRequest,
  ): Promise<AuthenticatedSession> {
    const csrf = await this.getCsrfToken();
    return request<AuthenticatedSession>("POST", "/auth/recovery/complete", {
      body: req,
      csrfToken: csrf.token,
    });
  },

  // Tree
  getTree(signal?: AbortSignal): Promise<Tree> {
    return request<Tree>("GET", "/tree", { signal });
  },

  async updateTree(
    req: UpdateTreeRequest,
    ifMatch: string,
  ): Promise<Tree> {
    const csrf = await this.getCsrfToken();
    return request<Tree>("PATCH", "/tree", {
      body: req,
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  // People
  listPeople(
    params?: {
      cursor?: string;
      limit?: number;
      query?: string;
      livingStatus?: string;
    },
    signal?: AbortSignal,
  ): Promise<PeoplePage> {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.query) searchParams.set("query", params.query);
    if (params?.livingStatus) searchParams.set("livingStatus", params.livingStatus);
    const qs = searchParams.toString();
    return request<PeoplePage>("GET", `/people${qs ? `?${qs}` : ""}`, { signal });
  },

  getPerson(personId: string, signal?: AbortSignal): Promise<Person> {
    return request<Person>("GET", `/people/${personId}`, { signal });
  },

  async createPerson(req: CreatePersonRequest): Promise<Person> {
    const csrf = await this.getCsrfToken();
    return request<Person>("POST", "/people", {
      body: req,
      csrfToken: csrf.token,
      idempotencyKey: idempotencyKey(),
    });
  },

  async updatePerson(
    personId: string,
    req: UpdatePersonRequest,
    ifMatch: string,
  ): Promise<Person> {
    const csrf = await this.getCsrfToken();
    return request<Person>("PATCH", `/people/${personId}`, {
      body: req,
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  async deletePerson(
    personId: string,
    ifMatch: string,
  ): Promise<DeletionStatus> {
    const csrf = await this.getCsrfToken();
    return request<DeletionStatus>("DELETE", `/people/${personId}`, {
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  // Relationships
  listRelationships(
    personId: string,
    params?: { cursor?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<RelationshipsPage> {
    const searchParams = new URLSearchParams({ personId });
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    return request<RelationshipsPage>(
      "GET",
      `/relationships?${searchParams.toString()}`,
      { signal },
    );
  },

  async createRelationship(
    req: CreateRelationshipRequest,
  ): Promise<Relationship> {
    const csrf = await this.getCsrfToken();
    return request<Relationship>("POST", "/relationships", {
      body: req,
      csrfToken: csrf.token,
      idempotencyKey: idempotencyKey(),
    });
  },

  async updateRelationship(
    relationshipId: string,
    req: UpdateRelationshipRequest,
    ifMatch: string,
  ): Promise<Relationship> {
    const csrf = await this.getCsrfToken();
    return request<Relationship>("PATCH", `/relationships/${relationshipId}`, {
      body: req,
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  async deleteRelationship(
    relationshipId: string,
    ifMatch: string,
  ): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("DELETE", `/relationships/${relationshipId}`, {
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  // Sources
  listSources(
    params?: { cursor?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<SourcesPage> {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return request<SourcesPage>("GET", `/sources${qs ? `?${qs}` : ""}`, { signal });
  },

  getSource(sourceId: string, signal?: AbortSignal): Promise<Source> {
    return request<Source>("GET", `/sources/${sourceId}`, { signal });
  },

  async createSource(req: CreateSourceRequest): Promise<Source> {
    const csrf = await this.getCsrfToken();
    return request<Source>("POST", "/sources", {
      body: req,
      csrfToken: csrf.token,
      idempotencyKey: idempotencyKey(),
    });
  },

  async updateSource(
    sourceId: string,
    req: UpdateSourceRequest,
    ifMatch: string,
  ): Promise<Source> {
    const csrf = await this.getCsrfToken();
    return request<Source>("PATCH", `/sources/${sourceId}`, {
      body: req,
      csrfToken: csrf.token,
      ifMatch,
    });
  },

  // Citations
  async createCitation(req: CreateCitationRequest): Promise<Citation> {
    const csrf = await this.getCsrfToken();
    return request<Citation>("POST", "/citations", {
      body: req,
      csrfToken: csrf.token,
      idempotencyKey: idempotencyKey(),
    });
  },

  async deleteCitation(citationId: string): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("DELETE", `/citations/${citationId}`, {
      csrfToken: csrf.token,
    });
  },

  // Invitations
  listInvitations(signal?: AbortSignal): Promise<{ items: Invitation[] }> {
    return request<{ items: Invitation[] }>("GET", "/invitations", { signal });
  },

  async createInvitation(
    req: CreateInvitationRequest,
  ): Promise<Invitation> {
    const csrf = await this.getCsrfToken();
    return request<Invitation>("POST", "/invitations", {
      body: req,
      csrfToken: csrf.token,
      idempotencyKey: idempotencyKey(),
    });
  },

  async revokeInvitation(invitationId: string): Promise<void> {
    const csrf = await this.getCsrfToken();
    return request<void>("DELETE", `/invitations/${invitationId}`, {
      csrfToken: csrf.token,
    });
  },

  async acceptInvitation(
    req: AcceptInvitationRequest,
  ): Promise<AuthenticatedSession> {
    const csrf = await this.getCsrfToken();
    return request<AuthenticatedSession>("POST", "/invitations/accept", {
      body: req,
      csrfToken: csrf.token,
    });
  },
};

export { ApiError, ApiValidationError };
