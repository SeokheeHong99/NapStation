export type Place = {
  id: string;
  name: string;
  building: string;
  floor: string;
  outlet: boolean;
  is_public: boolean;
  approved: boolean;
  description?: string;
  tags?: string[];
  hours?: string;
  noise_level?: string;
  busy_level?: string;
  lighting?: string;
  temperature?: string;
  wifi?: string;
  seating_type?: string;
  capacity?: number;
  photo_url?: string;
  photo_alt?: string;
  heart_count?: number;
  comment_count?: number;
  comments?: {
    id: string;
    text: string;
    created_at: string;
    photo_urls?: string[];
    heart_count?: number;
    replies?: {
      id: string;
      text: string;
      created_at: string;
    }[];
  }[];
  is_outdoor?: boolean;
  address?: string;
  lat?: number;
  lng?: number;
  last_verified_at?: string;
  recommendation_count?: number;
};

export type CandidatePlace = Place & {
  recommendation_count: number;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthSession = {
  user: AuthUser | null;
  heartedPlaceIds: string[];
  heartedCommentIds: string[];
  recommendedCandidateIds: string[];
};

export type Report = {
  id: string;
  place_id?: string | null;
  message: string;
  contact_email?: string;
  photo_urls?: string[];
  status?: "open" | "triaged" | "closed";
  created_at: string;
};
