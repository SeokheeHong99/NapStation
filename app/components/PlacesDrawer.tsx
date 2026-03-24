import type { CandidatePlace, Place } from "../lib/types";

type PlacesDrawerProps = {
  isOpen: boolean;
  view: "places" | "candidates";
  onViewChange: (view: "places" | "candidates") => void;
  buildings: {
    key: string;
    label: string;
    places: Place[];
    isOutdoor?: boolean;
  }[];
  candidates: CandidatePlace[];
  canRecommend: boolean;
  recommendedCandidateIds: string[];
  selectedBuilding?: string | null;
  onClose: () => void;
  onSelect: (building: string) => void;
  onRecommend: (candidateId: string) => void;
  onAuthRequired: () => void;
};

export default function PlacesDrawer({
  isOpen,
  view,
  onViewChange,
  buildings,
  candidates,
  canRecommend,
  recommendedCandidateIds,
  selectedBuilding,
  onClose,
  onSelect,
  onRecommend,
  onAuthRequired,
}: PlacesDrawerProps) {
  return (
    <aside className={`drawer ${isOpen ? "is-open" : ""}`}>
      <div className="drawer-header">
        <div>
          <div className="drawer-title">
            {view === "places" ? "All Nap Spots" : "Candidate Places"}
          </div>
          <div className="drawer-subtitle">
            {view === "places"
              ? `${buildings.length} buildings on the public map`
              : `${candidates.length} places waiting for recommendation`}
          </div>
        </div>
        <button type="button" className="icon-button" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="drawer-tabs">
        <button
          type="button"
          className={`drawer-tab ${view === "places" ? "is-active" : ""}`}
          onClick={() => onViewChange("places")}
        >
          Places
        </button>
        <button
          type="button"
          className={`drawer-tab ${view === "candidates" ? "is-active" : ""}`}
          onClick={() => onViewChange("candidates")}
        >
          Candidates
        </button>
      </div>
      <div className="drawer-list">
        {view === "places"
          ? buildings.map((group) => (
              <button
                key={group.key}
                type="button"
                className={`drawer-item ${
                  selectedBuilding === group.key ? "is-selected" : ""
                }`}
                onClick={() => onSelect(group.key)}
              >
                <div className="drawer-item-title">
                  {group.label}
                  {group.isOutdoor ? (
                    <span className="badge badge-outdoor">Outdoor</span>
                  ) : null}
                </div>
                <div className="drawer-item-meta">
                  {group.isOutdoor
                    ? "Outdoor nap spot"
                    : `${group.places.length} nap spots`}
                </div>
                <div className="drawer-item-meta">
                  Hours:{" "}
                  {group.places.map((place) => place.hours).find(Boolean) ||
                    "Check building"}
                </div>
              </button>
            ))
          : candidates.map((candidate) => (
              <div key={candidate.id} className="drawer-item candidate-card">
                <div className="drawer-item-title">{candidate.name}</div>
                <div className="drawer-item-meta">
                  {candidate.is_outdoor
                    ? "Outdoor candidate"
                    : `${candidate.building} · Floor ${candidate.floor}`}
                </div>
                <div className="drawer-item-meta">
                  {candidate.recommendation_count}/10 recommendations
                </div>
                <div className="drawer-item-meta">
                  {candidate.description || "Waiting for community validation."}
                </div>
                <button
                  type="button"
                  className="recommend-button"
                  onClick={() =>
                    canRecommend ? onRecommend(candidate.id) : onAuthRequired()
                  }
                  disabled={recommendedCandidateIds.includes(candidate.id)}
                >
                  {recommendedCandidateIds.includes(candidate.id)
                    ? "Recommended"
                    : "Recommend"}
                </button>
              </div>
            ))}
        {view === "candidates" && candidates.length === 0 ? (
          <div className="drawer-empty">
            No candidates yet. New submissions will appear here first.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
