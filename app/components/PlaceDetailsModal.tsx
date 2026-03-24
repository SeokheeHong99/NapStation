"use client";

import { useEffect, useMemo, useState } from "react";
import type { Place } from "../lib/types";

type PlaceDetailsModalProps = {
  buildingGroups: {
    key: string;
    label: string;
    places: Place[];
    isOutdoor?: boolean;
  }[];
  selectedGroupKey: string | null;
  onClose: () => void;
  onHeart: (placeId: string) => void;
  onAddComment: (
    placeId: string,
    text: string,
    photoUrls: string[]
  ) => Promise<boolean>;
  onCommentHeart: (commentId: string) => void;
  onAddReply: (commentId: string, text: string) => Promise<boolean>;
  canHeart: boolean;
  canComment: boolean;
  heartedPlaceIds: string[];
  heartedCommentIds: string[];
  onAuthRequired: () => void;
};

export default function PlaceDetailsModal({
  buildingGroups,
  selectedGroupKey,
  onClose,
  onHeart,
  onAddComment,
  onCommentHeart,
  onAddReply,
  canHeart,
  canComment,
  heartedPlaceIds,
  heartedCommentIds,
  onAuthRequired,
}: PlaceDetailsModalProps) {
  const selectedGroup = useMemo(
    () => buildingGroups.find((group) => group.key === selectedGroupKey) || null,
    [buildingGroups, selectedGroupKey]
  );
  const buildingName = selectedGroup?.label ?? null;
  const buildingPlaces = selectedGroup?.places ?? [];
  const isOutdoorGroup = selectedGroup?.isOutdoor ?? false;

  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentPhotos, setCommentPhotos] = useState<string[]>([]);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 3;
  const [sortBy, setSortBy] = useState<"hearts" | "comments" | "name">(
    "hearts"
  );
  const [showComments, setShowComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [photoModalUrls, setPhotoModalUrls] = useState<string[] | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [postingReply, setPostingReply] = useState(false);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedGroupKey) {
      setPageIndex(0);
      setCommentText("");
      setCommentPhotos([]);
      setCommentFiles([]);
      setShowComments(false);
      setCommentError(null);
      setReplyText("");
      setReplyError(null);
      setOpenReplies({});
      setExpandedComments({});
    }
  }, [selectedGroupKey]);

  useEffect(() => {
    if (!buildingPlaces.length) {
      return;
    }
    if (!activeSpotId || !buildingPlaces.some((place) => place.id === activeSpotId)) {
      setActiveSpotId(buildingPlaces[0].id);
    }
  }, [activeSpotId, buildingPlaces]);

  useEffect(() => {
    setPageIndex(0);
  }, [sortBy]);

  if (!buildingName || !buildingPlaces.length) {
    return null;
  }

  const activeSpot =
    buildingPlaces.find((place) => place.id === activeSpotId) ||
    buildingPlaces[0];

  const buildingHours =
    buildingPlaces.map((place) => place.hours).find(Boolean) ||
    "Check building";

  const sortedPlaces = [...buildingPlaces].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    const aHearts = a.heart_count ?? 0;
    const bHearts = b.heart_count ?? 0;
    const aComments = a.comment_count ?? a.comments?.length ?? 0;
    const bComments = b.comment_count ?? b.comments?.length ?? 0;
    if (sortBy === "comments") {
      return bComments - aComments || bHearts - aHearts;
    }
    return bHearts - aHearts || bComments - aComments;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPlaces.length / pageSize));
  const pagedPlaces = sortedPlaces.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  const heartCount = activeSpot.heart_count ?? 0;
  const commentCount =
    activeSpot.comment_count ?? activeSpot.comments?.length ?? 0;
  const comments = activeSpot.comments ?? [];
  const alreadyHearted = heartedPlaceIds.includes(activeSpot.id);

  const handleDirections = () => {
    const hasCoords =
      typeof activeSpot.lat === "number" && typeof activeSpot.lng === "number";
    if (!hasCoords) {
      window.alert("This spot does not have coordinates yet.");
      return;
    }
    const destination = `${activeSpot.lat},${activeSpot.lng}`;
    const openDirections = (origin?: string) => {
      const params = new URLSearchParams({
        api: "1",
        destination,
        travelmode: "walking",
      });
      if (origin) {
        params.set("origin", origin);
      }
      window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank");
    };
    if (!navigator.geolocation) {
      openDirections();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        openDirections(origin);
      },
      () => {
        openDirections();
      }
    );
  };

  const handleCommentPhotos = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    const nextFiles = Array.from(files);
    setCommentFiles((current) => [...current, ...nextFiles]);
    const urls = nextFiles.map((file) => URL.createObjectURL(file));
    setCommentPhotos((current) => [...current, ...urls]);
  };

  return (
    <>
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal modal-wide place-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {buildingName}
              {isOutdoorGroup ? (
                <span className="badge badge-outdoor">Outdoor</span>
              ) : null}
            </div>
            <div className="modal-subtitle">Hours: {buildingHours}</div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="place-modal-grid">
            <div className="spot-list">
              {showComments ? (
                <div className="comments-panel is-main">
                  <div className="comments-header">
                    Comments ({commentCount})
                  </div>
                <div className="comments-list">
                  {comments.length ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-row">
                          <div
                            className={`comment-text ${
                              expandedComments[comment.id] ? "is-expanded" : ""
                            }`}
                          >
                            {comment.text}
                          </div>
                        </div>
                        {comment.text.length > 80 ? (
                          <button
                            type="button"
                            className="comment-expand"
                            onClick={() =>
                              setExpandedComments((current) => ({
                                ...current,
                                [comment.id]: !current[comment.id],
                              }))
                            }
                          >
                            {expandedComments[comment.id]
                              ? "Show less"
                              : "...Read more"}
                          </button>
                        ) : null}
                        <div className="comment-footer">
                          <div className="comment-meta">
                            {new Date(comment.created_at).toLocaleString([], {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="comment-actions">
                            <button
                              type="button"
                              className="comment-action"
                              onClick={() =>
                                canComment
                                  ? onCommentHeart(comment.id)
                                  : onAuthRequired()
                              }
                              aria-label="Heart comment"
                              disabled={heartedCommentIds.includes(comment.id)}
                            >
                              {heartedCommentIds.includes(comment.id)
                                ? `❤ ${comment.heart_count ?? 0} Saved`
                                : `❤ ${comment.heart_count ?? 0}`}
                            </button>
                            <button
                              type="button"
                              className="comment-action"
                              onClick={() =>
                                setOpenReplies((current) => ({
                                  ...current,
                                  [comment.id]: !current[comment.id],
                                }))
                              }
                              aria-label="Toggle replies"
                            >
                              💬 {comment.replies?.length ?? 0}
                            </button>
                            {comment.photo_urls?.length ? (
                              <button
                                type="button"
                                className="comment-action"
                                onClick={() =>
                                  setPhotoModalUrls(comment.photo_urls || [])
                                }
                                aria-label="View comment photos"
                              >
                                🖼
                              </button>
                            ) : null}
                          </div>
                        </div>
                            {openReplies[comment.id] && comment.replies?.length ? (
                          <div className="comment-replies">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="comment-reply">
                                <div className="comment-text">{reply.text}</div>
                                <div className="comment-meta">
                                  {new Date(reply.created_at).toLocaleString(
                                    [],
                                    {
                                      year: "numeric",
                                      month: "numeric",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {openReplies[comment.id] ? (
                          <div className="comment-reply-form">
                            <input
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(event) =>
                                setReplyText(event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="primary-button"
                              onClick={async () => {
                                if (!canComment) {
                                  onAuthRequired();
                                  return;
                                }
                                setPostingReply(true);
                                setReplyError(null);
                                const ok = await onAddReply(
                                  comment.id,
                                  replyText
                                );
                                if (ok) {
                                  setReplyText("");
                                  setOpenReplies((current) => ({
                                    ...current,
                                    [comment.id]: true,
                                  }));
                                } else {
                                  setReplyError("Failed to send reply.");
                                }
                                setPostingReply(false);
                              }}
                              disabled={!replyText.trim() || postingReply || !canComment}
                            >
                              {postingReply ? "Replying..." : "Reply"}
                            </button>
                          </div>
                        ) : null}
                        {openReplies[comment.id] && replyError ? (
                          <div className="form-feedback">{replyError}</div>
                        ) : null}
                      </div>
                      ))
                    ) : (
                      <div className="comment-empty">
                        No comments yet. Be the first!
                      </div>
                    )}
                  </div>
                  <div className="comment-form">
                    <input
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      disabled={!canComment}
                    />
                    <label className="comment-photo-input">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={!canComment}
                        onChange={(event) =>
                          handleCommentPhotos(event.target.files)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={async () => {
                        if (!canComment) {
                          onAuthRequired();
                          return;
                        }
                        setPostingComment(true);
                        setCommentError(null);
                        let photoUrls: string[] = [];
                        if (commentFiles.length) {
                          const formData = new FormData();
                          commentFiles.forEach((file) =>
                            formData.append("files", file)
                          );
                          const uploadResponse = await fetch(
                            "/api/uploads/comment-images",
                            {
                              method: "POST",
                              body: formData,
                            }
                          );
                          if (!uploadResponse.ok) {
                            setPostingComment(false);
                            setCommentError("Failed to upload images.");
                            return;
                          }
                          const uploadData = (await uploadResponse.json()) as {
                            urls: string[];
                          };
                          photoUrls = uploadData.urls || [];
                        }
                        const ok = await onAddComment(
                          activeSpot.id,
                          commentText,
                          photoUrls
                        );
                        if (ok) {
                          setCommentText("");
                          setCommentPhotos([]);
                          setCommentFiles([]);
                        } else {
                          setCommentError("Failed to send comment.");
                        }
                        setPostingComment(false);
                      }}
                      disabled={!commentText.trim() || postingComment || !canComment}
                    >
                      {postingComment ? "Posting..." : "Post"}
                    </button>
                  </div>
                  {!canComment ? (
                    <div className="form-feedback">
                      Login required to post comments or replies.
                    </div>
                  ) : null}
                  {commentPhotos.length ? (
                    <div className="comment-photo-preview">
                      {commentPhotos.map((url) => (
                        <img key={url} src={url} alt="Selected comment" />
                      ))}
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setCommentPhotos([]);
                          setCommentFiles([]);
                        }}
                      >
                        Clear photos
                      </button>
                    </div>
                  ) : null}
                  {commentError ? (
                    <div className="form-feedback">{commentError}</div>
                  ) : null}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setShowComments(false)}
                  >
                    Back to spots
                  </button>
                </div>
              ) : (
                <>
                  <div className="spot-list-title">Nap spots in this building</div>
                  <label className="spot-sort">
                    Sort
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(
                          event.target.value as "hearts" | "comments" | "name"
                        )
                      }
                    >
                      <option value="hearts">Most hearts</option>
                      <option value="comments">Most comments</option>
                      <option value="name">Name A-Z</option>
                    </select>
                  </label>
                  {pagedPlaces.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={`spot-card ${
                        activeSpotId === place.id ? "is-selected" : ""
                      }`}
                      onClick={() => setActiveSpotId(place.id)}
                    >
                      <div className="spot-photo">
                        {place.photo_url ? (
                          <img src={place.photo_url} alt={place.photo_alt || ""} />
                        ) : (
                          <div className="spot-photo-fallback">Photo</div>
                        )}
                      </div>
                      <div className="spot-card-body">
                        <div className="spot-card-title">
                          {place.name}
                          {place.is_outdoor ? (
                            <span className="badge badge-outdoor">Outdoor</span>
                          ) : null}
                        </div>
                        <div className="spot-card-meta">
                          Floor {place.floor} •{" "}
                          {place.noise_level
                            ? `Noise ${place.noise_level}`
                            : "Quiet"}
                        </div>
                        <div className="spot-card-stats">
                          ❤ {place.heart_count ?? 0} · 💬{" "}
                          {place.comment_count ?? place.comments?.length ?? 0}
                        </div>
                      </div>
                    </button>
                  ))}
                  {totalPages > 1 ? (
                    <div className="spot-pagination">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          setPageIndex((index) => Math.max(0, index - 1))
                        }
                        disabled={pageIndex === 0}
                      >
                        Prev
                      </button>
                      <div className="spot-pagination-label">
                        Page {pageIndex + 1} of {totalPages}
                      </div>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          setPageIndex((index) =>
                            Math.min(totalPages - 1, index + 1)
                          )
                        }
                        disabled={pageIndex === totalPages - 1}
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className="spot-details">
              <div className="spot-details-header">
                <div>
                  <div className="spot-details-title">{activeSpot.name}</div>
                  <div className="spot-details-subtitle">
                    Floor {activeSpot.floor}
                  </div>
                </div>
                <button
                  type="button"
                  className="heart-button"
                  onClick={() =>
                    canHeart ? onHeart(activeSpot.id) : onAuthRequired()
                  }
                  disabled={alreadyHearted}
                >
                  {alreadyHearted ? `❤ ${heartCount} Saved` : `❤ ${heartCount}`}
                </button>
              </div>
              <p className="spot-details-desc">{activeSpot.description}</p>
              <div className="modal-grid">
                <div>
                  <div className="meta-label">Noise</div>
                  <div className="meta-value">
                    {activeSpot.noise_level || "Varies"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Busy level</div>
                  <div className="meta-value">
                    {activeSpot.busy_level || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Outlets</div>
                  <div className="meta-value">
                    {activeSpot.outlet ? "Available" : "Not available"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Lighting</div>
                  <div className="meta-value">
                    {activeSpot.lighting || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Seating</div>
                  <div className="meta-value">
                    {activeSpot.seating_type || "Mixed"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Temperature</div>
                  <div className="meta-value">
                    {activeSpot.temperature || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">Capacity</div>
                  <div className="meta-value">
                    {activeSpot.capacity ?? "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="meta-label">WiFi</div>
                  <div className="meta-value">{activeSpot.wifi || "Unknown"}</div>
                </div>
              </div>
              <div className="tags-row">
                <div className="modal-tags">
                  {(activeSpot.tags || []).map((tag) => (
                    <span key={tag} className="tag is-strong">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="comment-inline-button"
                  aria-label="Comments"
                  onClick={() => setShowComments((prev) => !prev)}
                >
                  💬
                </button>
              </div>
              
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="primary-button"
            onClick={handleDirections}
          >
            Get directions
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Back to map
          </button>
        </div>
        </div>
      </div>
      {photoModalUrls ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal comment-photo-modal">
            <div className="modal-header">
              <div className="modal-title">Comment photos</div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setPhotoModalUrls(null)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="photo-grid">
                {photoModalUrls.map((url) => (
                  <img key={url} src={url} alt="Comment" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
