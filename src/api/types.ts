export type ApiResponse<T> = { code: number; message: string; data: T };

export type PageResult<T> = { total: number; page: number; pageSize: number; records: T[] };

export type Destination = { id: number; name: string; type: number; coverImage?: string };

export type NoteSummary = {
  id: number;
  destinationId: number;
  title: string;
  coverImage?: string;
  days?: number | null;
  budgetPerPerson?: number | null;
  tags: string[];
  authorId: number;
  authorNickname: string;
  authorAvatarUrl?: string;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  createdAt: string;
  liked: boolean;
  favorited: boolean;
};

export type DayPlanItem = {
  dayNumber: number;
  title?: string;
  description?: string;
  cost?: number | null;
};

export type NoteDetail = NoteSummary & {
  content: string;
  images: string[];
  updatedAt: string;
  editable: boolean;
  destination?: { id: number; name: string } | null;
  transportType?: string | null;
  bestSeason?: string | null;
  viewCount?: number;
  dayPlans?: DayPlanItem[];
};

export type Comment = {
  id: number;
  parentId?: number | null;
  content: string;
  authorId: number;
  authorNickname: string;
  authorAvatarUrl?: string;
  createdAt: string;
  editable: boolean;
};

export type CreateNotePayload = {
  destinationId: number;
  title: string;
  content: string;
  coverImage?: string;
  days?: number;
  budgetPerPerson?: number;
  transportType?: string;
  bestSeason?: string;
  images?: string[];
  tags?: string[];
  dayPlans?: DayPlanItem[];
};

export type QaRule = {
  id: number;
  questionKey: string;
  questionText: string;
  inputType: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
};

/** id is optional: only present when it matches a local destinations table search result, purely for display enhancement; name is the actual association key, supporting free-text destinations */
export type DestinationInput = { id?: number; name: string };

export type SessionResponse = {
  id: number;
  sessionToken: string | null;
  status: number;
  destinations: DestinationInput[];
  createdAt: string;
};

export type SaveAnswersPayload = {
  destinations: DestinationInput[];
  days?: number;
  departDate?: string;
  returnDate?: string;
  departCity?: string;
  hasBookedTransport?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  travelerCount?: number;
  travelerComposition?: string;
  travelStyle?: string;
  interestTagIds?: number[];
  pacePreference?: string;
  accommodationType?: string;
  specialNeeds?: string;
  extraAnswers?: Record<string, unknown>;
};

export type AuthResult = { userId: number; accessToken: string; refreshToken: string; expiresIn: number };

export type UserProfile = {
  id: number;
  nickname: string;
  avatarUrl?: string;
  phone: string;
  gender: number;
  birthday?: string;
};

export type UpdateProfilePayload = {
  nickname?: string;
  avatarUrl?: string;
  gender?: number;
  birthday?: string;
};

export type UploadResult = { url: string };

export type CompleteResult = { planId: number; status: string };

export type ItineraryItem = {
  id: number;
  sortOrder: number;
  startTime: string | null;
  category: string;
  title: string;
  description?: string | null;
  estimatedCost: number | null;
  poiId: number | null;
  userEdited: boolean;
};

export type ItineraryDay = {
  dayNumber: number;
  date: string | null;
  /** The destination for this day; in single-destination itineraries this matches the plan-level destination, for multi-destination trips it is split by day */
  destination?: { id: number; name: string } | null;
  dailyEstimatedCost: number | null;
  items: ItineraryItem[];
};

export type ItineraryPlan = {
  id: number;
  sessionId: number;
  version: number;
  status: string;
  totalEstimatedCost: number | null;
  /** Primary destination (the first one for multi-destination trips) */
  destination: { id: number; name: string } | null;
  /** All destinations, in travel order; single-destination itineraries have only one element */
  destinations?: { id: number; name: string }[];
  days: ItineraryDay[];
};

export type ItineraryStatus = { status: string; progress: number };

export type Alternative = { poiId: number; name: string; estimatedCost: number | null; reason: string };

export type AdjustItemPayload = {
  action: 'replace' | 'remove' | 'edit';
  poiId?: number;
  title?: string;
  description?: string;
  estimatedCost?: number;
};

export type RegeneratePayload = {
  days?: number;
  budgetMin?: number;
  budgetMax?: number;
  travelerCount?: number;
  travelStyle?: string;
};

export type RegenerateResult = { planId: number; version: number; status: string };

export type ItineraryPlanSummary = {
  id: number;
  version: number;
  destination: { id: number; name: string } | null;
  days: number;
  totalEstimatedCost: number | null;
  status: string;
  createdAt: string;
};

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}
