export type OpaqueId = string;
export type Timestamp = string;
export type Email = string;
export type Password = string;
export type ResourceVersion = string;

export type Health = { status: "alive" };

export type DependencyState = "ready" | "degraded" | "unavailable" | "disabled";

export type Readiness = {
  status: "ready" | "degraded" | "unavailable";
  policyRevision: string;
  dependencies: {
    postgresql: DependencyState;
    opa: DependencyState;
    objectStorage: DependencyState;
    redis: DependencyState;
  };
};

export type BootstrapStatus = {
  available: boolean;
  expiresAt: Timestamp | null;
};

export type BootstrapAdminRequest = {
  bootstrapToken: string;
  email: Email;
  password: Password;
  displayName: string;
  treeName: string;
};

export type CsrfToken = {
  token: string;
  expiresAt: Timestamp;
};

export type LoginRequest = {
  email: Email;
  password: Password;
};

export type ReauthenticateRequest = {
  password: Password;
};

export type ChangePasswordRequest = {
  currentPassword: Password;
  newPassword: Password;
};

export type RecoveryRequest = {
  email: Email;
};

export type RecoveryCompleteRequest = {
  token: string;
  newPassword: Password;
};

export type Account = {
  id: OpaqueId;
  email: Email;
  displayName: string;
  status: "active" | "suspended" | "disabled";
  linkedPersonId: OpaqueId | null;
  createdAt: Timestamp;
};

export type Membership = {
  id: OpaqueId;
  treeId: OpaqueId;
  status: "active" | "suspended" | "revoked";
  roles: Array<"administrator" | "editor" | "contributor" | "viewer">;
  version: number;
};

export type Session = {
  id: OpaqueId;
  current: boolean;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  idleExpiresAt: Timestamp;
  absoluteExpiresAt: Timestamp;
  assurance: "normal" | "recent";
  clientLabel?: string;
};

export type AuthenticatedSession = {
  account: Account;
  membership: Membership;
  session: Session;
};

export type TreeSummary = {
  id: OpaqueId;
  name: string;
};

export type CurrentAccount = AuthenticatedSession & {
  tree: TreeSummary;
};

export type Tree = TreeSummary & {
  locale: string;
  description?: string;
  version: ResourceVersion;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type UpdateTreeRequest = {
  name?: string;
  locale?: string;
  description?: string | null;
};

export type LivingStatus = "living" | "deceased" | "unknown";
export type PrivacyLevel = "members" | "editors" | "administrators";
export type Confidence = "unknown" | "low" | "medium" | "high" | "disputed";
export type NameType = "birth" | "married" | "adopted" | "alias" | "religious" | "transliterated" | "other";

export type PersonName = {
  id: OpaqueId;
  type: NameType;
  display: string;
  given?: string;
  surname?: string;
  prefix?: string;
  suffix?: string;
  preferred: boolean;
  languageTag?: string;
};

export type GenealogicalDate = {
  kind: "exact" | "approximate" | "before" | "after" | "between" | "period" | "text" | "unknown";
  originalText: string;
  start?: string;
  end?: string;
  calendar?: string;
};

export type FactType =
  | "birth" | "death" | "burial" | "marriage" | "divorce"
  | "residence" | "occupation" | "education" | "nationality" | "religion" | "custom";

export type Fact = {
  id: OpaqueId;
  type: FactType;
  customType?: string;
  value?: string;
  date?: GenealogicalDate;
  place?: string;
  confidence: Confidence;
  privacy: PrivacyLevel;
  citations: CitationSummary[];
};

export type Person = {
  id: OpaqueId;
  treeId: OpaqueId;
  names: PersonName[];
  livingStatus: LivingStatus;
  privacy: PrivacyLevel;
  sex?: "female" | "male" | "intersex" | "unknown" | "not_recorded";
  notes?: string;
  facts: Fact[];
  version: ResourceVersion;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PersonNameInput = {
  type: NameType;
  display: string;
  given?: string;
  surname?: string;
  prefix?: string;
  suffix?: string;
  preferred: boolean;
  languageTag?: string;
};

export type FactInput = {
  type: FactType;
  customType?: string;
  value?: string;
  date?: GenealogicalDate;
  place?: string;
  confidence: Confidence;
  privacy: PrivacyLevel;
};

export type CreatePersonRequest = {
  names: PersonNameInput[];
  livingStatus: LivingStatus;
  privacy: PrivacyLevel;
  sex?: "female" | "male" | "intersex" | "unknown" | "not_recorded";
  notes?: string;
  facts?: FactInput[];
};

export type UpdatePersonRequest = {
  names?: PersonNameInput[];
  livingStatus?: LivingStatus;
  privacy?: PrivacyLevel;
  sex?: "female" | "male" | "intersex" | "unknown" | "not_recorded";
  notes?: string | null;
  facts?: FactInput[];
};

export type PeoplePage = {
  items: Person[];
  nextCursor?: string | null;
};

export type RelationshipType =
  | "biological_parent" | "adoptive_parent" | "foster_parent" | "guardian"
  | "spouse" | "partner" | "step_parent" | "sibling" | "custom";

export type Relationship = {
  id: OpaqueId;
  treeId: OpaqueId;
  fromPersonId: OpaqueId;
  toPersonId: OpaqueId;
  type: RelationshipType;
  customType?: string;
  startDate?: GenealogicalDate;
  endDate?: GenealogicalDate;
  confidence: Confidence;
  privacy: PrivacyLevel;
  notes?: string;
  citations: CitationSummary[];
  version: ResourceVersion;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateRelationshipRequest = {
  fromPersonId: OpaqueId;
  toPersonId: OpaqueId;
  type: RelationshipType;
  customType?: string;
  startDate?: GenealogicalDate;
  endDate?: GenealogicalDate;
  confidence: Confidence;
  privacy: PrivacyLevel;
  notes?: string;
};

export type UpdateRelationshipRequest = {
  type?: RelationshipType;
  customType?: string;
  startDate?: GenealogicalDate;
  endDate?: GenealogicalDate;
  confidence?: Confidence;
  privacy?: PrivacyLevel;
  notes?: string | null;
};

export type RelationshipsPage = {
  items: Relationship[];
  nextCursor?: string | null;
};

export type SourceType =
  | "document" | "book" | "archive" | "website" | "interview"
  | "image" | "certificate" | "database" | "other";

export type Source = {
  id: OpaqueId;
  treeId: OpaqueId;
  title: string;
  type: SourceType;
  author?: string;
  repository?: string;
  publication?: string;
  locator?: string;
  notes?: string;
  mediaIds?: OpaqueId[];
  version: ResourceVersion;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateSourceRequest = {
  title: string;
  type: SourceType;
  author?: string;
  repository?: string;
  publication?: string;
  locator?: string;
  notes?: string;
  mediaIds?: OpaqueId[];
};

export type UpdateSourceRequest = CreateSourceRequest;

export type SourcesPage = {
  items: Source[];
  nextCursor?: string | null;
};

export type CitationTargetType = "person" | "person_name" | "fact" | "relationship" | "source";

export type CitationSummary = {
  id: OpaqueId;
  sourceId: OpaqueId;
  targetType: CitationTargetType;
  targetId: OpaqueId;
};

export type Citation = CitationSummary & {
  locator?: string;
  transcription?: string;
  confidence: Confidence;
  notes?: string;
  createdAt: Timestamp;
};

export type CreateCitationRequest = {
  sourceId: OpaqueId;
  targetType: CitationTargetType;
  targetId: OpaqueId;
  locator?: string;
  transcription?: string;
  confidence: Confidence;
  notes?: string;
};

export type DeletionStatus = {
  id: OpaqueId;
  state: "accepted" | "blocked" | "deleting" | "completed" | "failed";
  reasonCode?: string;
  requestedAt: Timestamp;
};

export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  requestId: string;
};

export type ValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ValidationProblem = Problem & {
  errors: ValidationIssue[];
};

export type Invitation = {
  id: OpaqueId;
  email: Email;
  role: "administrator" | "editor" | "contributor" | "viewer";
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: Timestamp;
  createdAt: Timestamp;
};

export type CreateInvitationRequest = {
  email: Email;
  role: "administrator" | "editor" | "contributor" | "viewer";
  expiresInHours?: number;
};

export type AcceptInvitationRequest = {
  token: string;
  displayName: string;
  password: Password;
};
