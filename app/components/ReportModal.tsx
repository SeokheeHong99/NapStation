"use client";

import { useEffect, useState } from "react";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedPlaceId?: string | null;
  places: { id: string; name: string; building: string }[];
};

export default function ReportModal({
  isOpen,
  onClose,
  selectedPlaceId,
  places,
}: ReportModalProps) {
  const [placeId, setPlaceId] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && selectedPlaceId && !placeId) {
      setPlaceId(selectedPlaceId);
    }
  }, [isOpen, placeId, selectedPlaceId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredPlaces = places.filter((place) => {
    if (!searchTerm.trim()) {
      return true;
    }
    const haystack = `${place.building} ${place.name}`.toLowerCase();
    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const groupedPlaces = filteredPlaces.reduce<Record<string, typeof places>>(
    (acc, place) => {
      const key = place.building || "Other";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(place);
      return acc;
    },
    {}
  );

  const sortedGroups = Object.entries(groupedPlaces)
    .map(([building, group]) => ({
      building,
      places: [...group].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.building.localeCompare(b.building));

  if (!isOpen && !showSuccess) {
    return null;
  }

  const handleReportPhotos = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    const nextFiles = Array.from(files);
    setReportFiles((current) => [...current, ...nextFiles]);
    const urls = nextFiles.map((file) => URL.createObjectURL(file));
    setReportPhotos((current) => [...current, ...urls]);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setFeedback("Message is required.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      let photoUrls: string[] = [];
      if (reportFiles.length) {
        const formData = new FormData();
        reportFiles.forEach((file) => formData.append("files", file));
        const uploadResponse = await fetch("/api/uploads/report-images", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload images.");
        }
        const uploadData = (await uploadResponse.json()) as { urls: string[] };
        photoUrls = uploadData.urls || [];
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: placeId.trim() || undefined,
          message,
          contact_email: contactEmail.trim() || undefined,
          photo_urls: photoUrls,
        }),
      });
      if (!response.ok) {
        let message = "Failed to send report.";
        const contentType = response.headers.get("content-type") || "";
        try {
          if (contentType.includes("application/json")) {
            const errorData = (await response.json()) as { error?: string };
            message = errorData.error || message;
          } else {
            const text = await response.text();
            if (text) {
              message = text;
            }
          }
        } catch {
          // Ignore parse errors and keep fallback message.
        }
        throw new Error(message);
      }
      setFeedback(null);
      setPlaceId("");
      setMessage("");
      setContactEmail("");
      setReportFiles([]);
      setReportPhotos([]);
      setShowSuccess(true);
      onClose();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Failed to send report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Report a correction</div>
                <div className="modal-subtitle">
                  Help us keep the map accurate for everyone.
                </div>
              </div>
              <button type="button" className="icon-button" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="span-2">
                  Related place (optional)
                  <input
                    className="search-input"
                    placeholder="Search by building or spot name"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <select
                    value={placeId}
                    onChange={(event) => setPlaceId(event.target.value)}
                  >
                    <option value="">Not sure / general report</option>
                    {sortedGroups.map((group) => (
                      <optgroup key={group.building} label={group.building}>
                        {group.places.map((place) => (
                          <option key={place.id} value={place.id}>
                            {place.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="span-2">
                  What changed?
                  <textarea
                    placeholder="Tell us what needs updating"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>
                <label className="span-2">
                  Contact email (optional)
                  <input
                    placeholder="you@ubc.ca"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </label>
                <label className="span-2">
                  Photos (optional)
                  <div className="comment-form">
                    <label className="comment-photo-input">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          handleReportPhotos(event.target.files)
                        }
                      />
                    </label>
                    {reportPhotos.length ? (
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setReportFiles([]);
                          setReportPhotos([]);
                        }}
                      >
                        Clear photos
                      </button>
                    ) : null}
                  </div>
                  {reportPhotos.length ? (
                    <div className="comment-photo-preview">
                      {reportPhotos.map((url) => (
                        <img key={url} src={url} alt="Selected report" />
                      ))}
                    </div>
                  ) : null}
                </label>
              </div>
              {feedback ? <div className="form-feedback">{feedback}</div> : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send report"}
              </button>
              <button type="button" className="ghost-button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showSuccess ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal success-modal">
            <div className="modal-header">
              <div className="modal-title">Report sent</div>
            </div>
            <div className="modal-body">
              <p>Report sent. Thanks for the update.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowSuccess(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
