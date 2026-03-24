"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AddPlaceModal from "./components/AddPlaceModal";
import FloatingActions from "./components/FloatingActions";
import MapView from "./components/MapView";
import PlaceDetailsModal from "./components/PlaceDetailsModal";
import PlacesDrawer from "./components/PlacesDrawer";
import ReportModal from "./components/ReportModal";
import SearchBar from "./components/SearchBar";
import type { AuthSession, CandidatePlace, Place } from "./lib/types";

function filterPlaces<T extends Place>(places: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return places;
  }

  return places.filter((place) => {
    const haystack = [
      place.name,
      place.building,
      place.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function normalizePlace<T extends Place>(place: T): T {
  const comments = place.comments ?? [];
  return {
    ...place,
    heart_count: place.heart_count ?? 0,
    comments,
    comment_count: place.comment_count ?? comments.length,
    recommendation_count: place.recommendation_count ?? 0,
  };
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerView, setDrawerView] = useState<"places" | "candidates">(
    "places"
  );
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [tempCoords, setTempCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [candidatePlaces, setCandidatePlaces] = useState<CandidatePlace[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession>({
    user: null,
    heartedPlaceIds: [],
    heartedCommentIds: [],
    recommendedCandidateIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const [placesResponse, candidatesResponse, sessionResponse] =
          await Promise.all([
          fetch("/api/places"),
          fetch("/api/candidates"),
          fetch("/api/auth/session"),
        ]);
        if (!placesResponse.ok) {
          throw new Error("Failed to load places.");
        }
        if (!candidatesResponse.ok) {
          throw new Error("Failed to load candidate places.");
        }
        if (!sessionResponse.ok) {
          throw new Error("Failed to load session.");
        }

        const [placesData, candidatesData, sessionData] = (await Promise.all([
          placesResponse.json(),
          candidatesResponse.json(),
          sessionResponse.json(),
        ])) as [Place[], CandidatePlace[], AuthSession];

        if (isActive) {
          setPlaces(placesData.map(normalizePlace));
          setCandidatePlaces(candidatesData.map(normalizePlace));
          setAuthSession(sessionData);
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load places."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const visiblePlaces = useMemo(
    () => filterPlaces(places, query),
    [places, query]
  );
  const currentUser = authSession.user;
  const visibleCandidatePlaces = useMemo(
    () => filterPlaces(candidatePlaces, query),
    [candidatePlaces, query]
  );

  const buildingGroups = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; places: Place[]; isOutdoor: boolean }
    >();
    visiblePlaces.forEach((place) => {
      const isOutdoor = !!place.is_outdoor;
      const key = isOutdoor ? `outdoor:${place.id}` : place.building || "Unknown";
      const label = isOutdoor ? place.name : place.building || "Unknown";
      const existing = groups.get(key);
      if (existing) {
        existing.places.push(place);
      } else {
        groups.set(key, { label, places: [place], isOutdoor });
      }
    });
    return Array.from(groups.entries()).map(([key, group]) => {
      const withCoords = group.places.filter(
        (place) => typeof place.lat === "number" && typeof place.lng === "number"
      );
      const lat =
        withCoords.reduce((sum, place) => sum + (place.lat as number), 0) /
          (withCoords.length || 1) || undefined;
      const lng =
        withCoords.reduce((sum, place) => sum + (place.lng as number), 0) /
          (withCoords.length || 1) || undefined;
      return {
        key,
        label: group.label,
        places: group.places,
        lat,
        lng,
        isOutdoor: group.isOutdoor,
      };
    });
  }, [visiblePlaces]);

  const selectedPlaceForReport = useMemo(() => {
    if (!selectedBuilding) {
      return null;
    }
    const group = buildingGroups.find((item) => item.key === selectedBuilding);
    return group?.places[0]?.id || null;
  }, [buildingGroups, selectedBuilding]);

  const buildings = useMemo(() => {
    const unique = new Set(
      places.map((place) => place.building).filter(Boolean)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [places]);

  const requestAuth = () => {
    router.push("/login");
  };

  const handleCandidateRecommended = async (candidateId: string) => {
    if (!currentUser) {
      requestAuth();
      return;
    }

    if (authSession.recommendedCandidateIds.includes(candidateId)) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates/${candidateId}/recommend`, {
        method: "POST",
      });
      if (response.status === 409) {
        setAuthSession((current) => ({
          ...current,
          recommendedCandidateIds: [
            ...current.recommendedCandidateIds,
            candidateId,
          ],
        }));
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to recommend candidate.");
      }
      const data = (await response.json()) as {
        candidate: CandidatePlace | null;
        promoted: boolean;
        promoted_place: Place | null;
      };

      if (data.promoted && data.promoted_place) {
        setCandidatePlaces((current) =>
          current.filter((candidate) => candidate.id !== candidateId)
        );
        setAuthSession((current) => ({
          ...current,
          recommendedCandidateIds: [
            ...current.recommendedCandidateIds,
            candidateId,
          ],
        }));
        setPlaces((current) => [
          normalizePlace(data.promoted_place as Place),
          ...current,
        ]);
        setDrawerView("places");
        return;
      }

      if (data.candidate) {
        setAuthSession((current) => ({
          ...current,
          recommendedCandidateIds: [
            ...current.recommendedCandidateIds,
            candidateId,
          ],
        }));
        setCandidatePlaces((current) =>
          current
            .map((candidate) =>
              candidate.id === candidateId
                ? normalizePlace(data.candidate as CandidatePlace)
                : candidate
            )
            .sort(
              (left, right) =>
                (right.recommendation_count ?? 0) -
                (left.recommendation_count ?? 0)
            )
        );
      }
    } catch {
      // Ignore failure for now and keep the current count visible.
    }
  };

  const handleHeart = async (placeId: string) => {
    if (!currentUser) {
      requestAuth();
      return;
    }

    if (authSession.heartedPlaceIds.includes(placeId)) {
      return;
    }

    setPlaces((current) =>
      current.map((place) =>
        place.id === placeId
          ? { ...place, heart_count: (place.heart_count ?? 0) + 1 }
          : place
      )
    );
    try {
      const response = await fetch(`/api/places/${placeId}/heart`, {
        method: "POST",
      });
      if (response.status === 409) {
        setAuthSession((current) => ({
          ...current,
          heartedPlaceIds: [...current.heartedPlaceIds, placeId],
        }));
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to send heart.");
      }
      const data = (await response.json()) as { heart_count: number };
      setAuthSession((current) => ({
        ...current,
        heartedPlaceIds: [...current.heartedPlaceIds, placeId],
      }));
      setPlaces((current) =>
        current.map((place) =>
          place.id === placeId
            ? { ...place, heart_count: data.heart_count }
            : place
        )
      );
    } catch {
      setPlaces((current) =>
        current.map((place) =>
          place.id === placeId
            ? { ...place, heart_count: Math.max((place.heart_count ?? 1) - 1, 0) }
            : place
        )
      );
    }
  };

  const handleAddComment = async (
    placeId: string,
    text: string,
    photoUrls: string[]
  ) => {
    if (!currentUser) {
      requestAuth();
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    try {
      const response = await fetch(`/api/places/${placeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, photo_urls: photoUrls }),
      });
      if (!response.ok) {
        throw new Error("Failed to add comment.");
      }
      const data = (await response.json()) as {
        comment: {
          id: string;
          text: string;
          created_at: string;
          photo_urls?: string[];
          heart_count?: number;
          replies?: { id: string; text: string; created_at: string }[];
        };
        comment_count: number;
      };
      setPlaces((current) =>
        current.map((place) => {
          if (place.id !== placeId) {
            return place;
          }
          const comments = place.comments ?? [];
          return {
            ...place,
            comments: [...comments, data.comment],
            comment_count: data.comment_count,
          };
        })
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleCommentHeart = async (commentId: string) => {
    if (!currentUser) {
      requestAuth();
      return;
    }

    if (authSession.heartedCommentIds.includes(commentId)) {
      return;
    }

    setPlaces((current) =>
      current.map((place) => ({
        ...place,
        comments: (place.comments || []).map((comment) =>
          comment.id === commentId
            ? { ...comment, heart_count: (comment.heart_count ?? 0) + 1 }
            : comment
        ),
      }))
    );
    try {
      const response = await fetch(`/api/comments/${commentId}/heart`, {
        method: "POST",
      });
      if (response.status === 409) {
        setAuthSession((current) => ({
          ...current,
          heartedCommentIds: [...current.heartedCommentIds, commentId],
        }));
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to send heart.");
      }
      const data = (await response.json()) as { heart_count: number };
      setAuthSession((current) => ({
        ...current,
        heartedCommentIds: [...current.heartedCommentIds, commentId],
      }));
      setPlaces((current) =>
        current.map((place) => ({
          ...place,
          comments: (place.comments || []).map((comment) =>
            comment.id === commentId
              ? { ...comment, heart_count: data.heart_count }
              : comment
          ),
        }))
      );
    } catch {
      setPlaces((current) =>
        current.map((place) => ({
          ...place,
          comments: (place.comments || []).map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  heart_count: Math.max((comment.heart_count ?? 1) - 1, 0),
                }
              : comment
          ),
        }))
      );
    }
  };

  const handleAddReply = async (commentId: string, text: string) => {
    if (!currentUser) {
      requestAuth();
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    try {
      const response = await fetch(`/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!response.ok) {
        throw new Error("Failed to send reply.");
      }
      const data = (await response.json()) as {
        reply: { id: string; text: string; created_at: string };
      };
      setPlaces((current) =>
        current.map((place) => ({
          ...place,
          comments: (place.comments || []).map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), data.reply],
                }
              : comment
          ),
        }))
      );
      return true;
    } catch {
      return false;
    }
  };

  const handlePickLocation = () => {
    setIsPickingLocation(true);
    setShowAddModal(false);
  };

  return (
    <main className="page">
      <header className="top-bar">
        <div className="brand">
          <div className="brand-title">NapStation</div>
          <div className="brand-subtitle">UBC nap space map</div>
        </div>
        <SearchBar value={query} onChange={setQuery} />
        <div className="top-bar-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            Menu
          </button>
          {currentUser ? (
            <button
              type="button"
              className="icon-button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setAuthSession({
                  user: null,
                  heartedPlaceIds: [],
                  heartedCommentIds: [],
                  recommendedCandidateIds: [],
                });
              }}
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              className="icon-button"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <MapView
        selectedBuilding={selectedBuilding}
        onSelectBuilding={(building) => setSelectedBuilding(building)}
        onClear={() => setSelectedBuilding(null)}
        buildingGroups={buildingGroups}
        isPickingLocation={isPickingLocation}
        tempMarker={tempCoords}
        onMapClick={(coords) => {
          if (!isPickingLocation) {
            return;
          }
          setTempCoords(coords);
          setIsPickingLocation(false);
          setShowAddModal(true);
        }}
      />

      <PlacesDrawer
        isOpen={drawerOpen}
        view={drawerView}
        onViewChange={setDrawerView}
        buildings={buildingGroups}
        candidates={visibleCandidatePlaces}
        canRecommend={!!currentUser}
        recommendedCandidateIds={authSession.recommendedCandidateIds}
        selectedBuilding={selectedBuilding}
        onClose={() => setDrawerOpen(false)}
        onSelect={(building) => setSelectedBuilding(building)}
        onRecommend={handleCandidateRecommended}
        onAuthRequired={requestAuth}
      />

      <FloatingActions
        canAdd={!!currentUser}
        canReport={!!currentUser}
        onAuthRequired={requestAuth}
        onAdd={() => setShowAddModal(true)}
        onReport={() => {
          setTempCoords(null);
          setIsPickingLocation(false);
          setShowReportModal(true);
        }}
      />

      <PlaceDetailsModal
        buildingGroups={buildingGroups}
        selectedGroupKey={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onHeart={handleHeart}
        onAddComment={handleAddComment}
        onCommentHeart={handleCommentHeart}
        onAddReply={handleAddReply}
        canHeart={!!currentUser}
        canComment={!!currentUser}
        heartedPlaceIds={authSession.heartedPlaceIds}
        heartedCommentIds={authSession.heartedCommentIds}
        onAuthRequired={requestAuth}
      />

      <AddPlaceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        buildings={buildings}
        tempCoords={tempCoords}
        onPickLocation={handlePickLocation}
        onClearTemp={() => setTempCoords(null)}
        onCreated={(candidate) => {
          setCandidatePlaces((current) => [
            normalizePlace(candidate),
            ...current,
          ]);
          setDrawerView("candidates");
          setDrawerOpen(true);
        }}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        selectedPlaceId={selectedPlaceForReport}
        places={places}
      />
    </main>
  );
}
