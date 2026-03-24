import type { CandidatePlace, Place } from "./types";

const RECOMMENDATION_THRESHOLD = 10;

const globalForCandidates = globalThis as typeof globalThis & {
  candidatePlaces?: CandidatePlace[];
  promotedPlaces?: Place[];
};

function ensureStores() {
  if (!globalForCandidates.candidatePlaces) {
    globalForCandidates.candidatePlaces = [];
  }
  if (!globalForCandidates.promotedPlaces) {
    globalForCandidates.promotedPlaces = [];
  }
}

export function getRecommendationThreshold() {
  return RECOMMENDATION_THRESHOLD;
}

export function listCandidatePlaces() {
  ensureStores();
  return [...(globalForCandidates.candidatePlaces as CandidatePlace[])].sort(
    (a, b) => b.recommendation_count - a.recommendation_count
  );
}

export function listPromotedPlaces() {
  ensureStores();
  return [...(globalForCandidates.promotedPlaces as Place[])];
}

export function createCandidatePlace(
  place: Omit<CandidatePlace, "recommendation_count"> & {
    recommendation_count?: number;
  }
) {
  ensureStores();

  const candidate: CandidatePlace = {
    ...place,
    recommendation_count: place.recommendation_count ?? 0,
  };

  globalForCandidates.candidatePlaces = [
    candidate,
    ...(globalForCandidates.candidatePlaces as CandidatePlace[]),
  ];

  return candidate;
}

export function recommendCandidatePlace(id: string) {
  ensureStores();

  const candidates = globalForCandidates.candidatePlaces as CandidatePlace[];
  const target = candidates.find((candidate) => candidate.id === id);

  if (!target) {
    return null;
  }

  target.recommendation_count += 1;

  if (target.recommendation_count >= RECOMMENDATION_THRESHOLD) {
    const promotedPlace: Place = {
      ...target,
      approved: true,
    };

    globalForCandidates.candidatePlaces = candidates.filter(
      (candidate) => candidate.id !== id
    );
    globalForCandidates.promotedPlaces = [
      promotedPlace,
      ...(globalForCandidates.promotedPlaces as Place[]),
    ];

    return {
      candidate: null,
      promotedPlace,
      promoted: true,
    };
  }

  return {
    candidate: { ...target },
    promotedPlace: null,
    promoted: false,
  };
}
