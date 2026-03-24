"use client";

import { useState } from "react";

import type { CandidatePlace } from "../lib/types";

type AddPlaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  buildings: string[];
  tempCoords: { lat: number; lng: number } | null;
  onPickLocation: () => void;
  onClearTemp: () => void;
  onCreated: (candidate: CandidatePlace) => void;
};

export default function AddPlaceModal({
  isOpen,
  onClose,
  buildings,
  tempCoords,
  onPickLocation,
  onClearTemp,
  onCreated,
}: AddPlaceModalProps) {
  const [name, setName] = useState("");
  const [buildingChoice, setBuildingChoice] = useState("new");
  const [buildingName, setBuildingName] = useState("");
  const [floor, setFloor] = useState("");
  const [outlet, setOutlet] = useState(true);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [busyLevel, setBusyLevel] = useState("n/a");
  const [noiseLevel, setNoiseLevel] = useState("n/a");
  const [seatingType, setSeatingType] = useState("chair");
  const [capacity, setCapacity] = useState("");
  const [lighting, setLighting] = useState("n/a");
  const [temperature, setTemperature] = useState("n/a");
  const [wifi, setWifi] = useState("n/a");
  const [openingStartHour, setOpeningStartHour] = useState("");
  const [openingStartMeridiem, setOpeningStartMeridiem] = useState("AM");
  const [openingEndHour, setOpeningEndHour] = useState("");
  const [openingEndMeridiem, setOpeningEndMeridiem] = useState("PM");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const normalizedTag = (value: string) => value.trim().toLowerCase();
  const isValidTag = (value: string) =>
    /^[a-z0-9-]+$/.test(value) && value.length > 0;

  const handleAddTag = () => {
    const nextTag = normalizedTag(tagInput);
    if (!nextTag) {
      return;
    }
    if (!isValidTag(nextTag)) {
      setFeedback("Tags must be a single word (letters, numbers, hyphens).");
      return;
    }
    if (tags.includes(nextTag)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 10) {
      setFeedback("You can add up to 10 tags.");
      return;
    }
    setTags((current) => [...current, nextTag]);
    setTagInput("");
  };

  if (!isOpen && !showSuccess) {
    return null;
  }

  const resolvedBuilding =
    buildingChoice === "new" ? buildingName.trim() : buildingChoice;

  const handleSubmit = async () => {
    const openingTime = `${openingStartHour.trim()}${openingStartMeridiem} - ${openingEndHour.trim()}${openingEndMeridiem}`;
    if (!name.trim()) {
      setFeedback("Name is required.");
      return;
    }
    if (!isOutdoor && !floor.trim()) {
      setFeedback("Floor is required for indoor locations.");
      return;
    }
    if (!isOutdoor && buildingChoice === "new") {
      if (!buildingName.trim()) {
        setFeedback("New building name is required.");
        return;
      }
      if (!address.trim()) {
        setFeedback("Address is required for new building spots.");
        return;
      }
    }
    if (isOutdoor && !tempCoords) {
      setFeedback("Please place a pin on the map.");
      return;
    }
    if (
      !isOutdoor &&
      (!openingStartHour.trim() ||
        !openingEndHour.trim() ||
        !openingStartMeridiem ||
        !openingEndMeridiem)
    ) {
      setFeedback("Opening time is required for indoor locations.");
      return;
    }
    if (tags.length > 10) {
      setFeedback("You can add up to 10 tags.");
      return;
    }
    if (tags.some((tag) => !isValidTag(tag))) {
      setFeedback("Tags must be a single word (letters, numbers, hyphens).");
      return;
    }
    if (!isOutdoor && (!resolvedBuilding || !floor.trim())) {
      setFeedback("Building and floor are required for indoor locations.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          building: isOutdoor ? "Outdoor" : resolvedBuilding,
          floor: isOutdoor ? "N/A" : floor,
          outlet: isOutdoor ? false : outlet,
          is_outdoor: isOutdoor,
          is_new_building: !isOutdoor && buildingChoice === "new",
          address: address.trim() || undefined,
          lat: isOutdoor ? tempCoords?.lat : undefined,
          lng: isOutdoor ? tempCoords?.lng : undefined,
          photo_url: photoDataUrl || undefined,
          photo_alt: photoDataUrl ? `${name.trim()} photo` : undefined,
          busy_level: busyLevel,
          noise_level: noiseLevel,
          seating_type: seatingType,
          capacity: capacity ? Number(capacity) : undefined,
          lighting,
          temperature,
          wifi,
          hours: openingTime.trim() || undefined,
          description,
          tags,
        }),
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to submit suggestion.");
      }
      const created = (await response.json()) as CandidatePlace;
      setFeedback(null);
      setName("");
      setBuildingChoice("new");
      setBuildingName("");
      setFloor("");
      setOutlet(true);
      setIsOutdoor(false);
      setDescription("");
      setAddress("");
      setPhotoDataUrl(null);
      setBusyLevel("n/a");
      setNoiseLevel("n/a");
      setSeatingType("chair");
      setCapacity("");
      setLighting("n/a");
      setTemperature("n/a");
      setWifi("n/a");
      setOpeningStartHour("");
      setOpeningStartMeridiem("AM");
      setOpeningEndHour("");
      setOpeningEndMeridiem("PM");
      setTagInput("");
      setTags([]);
      setShowSuccess(true);
      onCreated(created);
      onClearTemp();
      onClose();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Failed to submit suggestion."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal add-place-modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Suggest a nap spot</div>
                <div className="modal-subtitle">
                  Suggestions are reviewed before going public.
                </div>
                {feedback ? (
                  <div className="form-feedback">{feedback}</div>
                ) : null}
              </div>
              <button type="button" className="icon-button" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  <span className="label-text">
                    Spot name <span className="required-asterisk">*</span>
                  </span>
                  <input
                    placeholder="e.g. Koerner Library Nook"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={isOutdoor}
                    onChange={(event) => {
                      const nextValue = event.target.checked;
                      setIsOutdoor(nextValue);
                      if (nextValue) {
                        setOpeningStartHour("");
                        setOpeningStartMeridiem("AM");
                        setOpeningEndHour("");
                        setOpeningEndMeridiem("PM");
                      }
                    }}
                  />
                  Outdoor location
                </label>
                <label>
                  Building
                  <select
                    value={buildingChoice}
                    onChange={(event) => setBuildingChoice(event.target.value)}
                    disabled={isOutdoor}
                  >
                    <option value="new">New building...</option>
                    {buildings.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                </label>
                {buildingChoice === "new" && !isOutdoor ? (
                  <>
                    <label>
                      <span className="label-text">
                        New building name{" "}
                        <span className="required-asterisk">*</span>
                      </span>
                      <input
                        placeholder="Irving K. Barber"
                        value={buildingName}
                        onChange={(event) => setBuildingName(event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="label-text">
                        Opening time <span className="required-asterisk">*</span>
                      </span>
                      <div className="time-input-row">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="7"
                          value={openingStartHour}
                          onChange={(event) =>
                            setOpeningStartHour(event.target.value)
                          }
                        />
                        <select
                          value={openingStartMeridiem}
                          onChange={(event) =>
                            setOpeningStartMeridiem(event.target.value)
                          }
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        <span className="time-separator">-</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="10"
                          value={openingEndHour}
                          onChange={(event) =>
                            setOpeningEndHour(event.target.value)
                          }
                        />
                        <select
                          value={openingEndMeridiem}
                          onChange={(event) =>
                            setOpeningEndMeridiem(event.target.value)
                          }
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </label>
                  </>
                ) : null}
                {!isOutdoor && buildingChoice === "new" ? (
                  <label className="span-2">
                    <span className="label-text">
                      Address <span className="required-asterisk">*</span>
                    </span>
                    <input
                      placeholder="123 Main Mall, Vancouver"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                ) : null}
                {isOutdoor ? (
                  <label className="span-2">
                    <span className="label-text">
                      Map pin <span className="required-asterisk">*</span>
                    </span>
                    <div className="pin-picker">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={onPickLocation}
                      >
                        Make a pin
                      </button>
                      <div className="pin-status">
                        {tempCoords
                          ? `Selected: ${tempCoords.lat.toFixed(
                              5
                            )}, ${tempCoords.lng.toFixed(5)}`
                          : "No pin placed yet"}
                      </div>
                    </div>
                  </label>
                ) : null}
                {!isOutdoor && buildingChoice !== "new" ? (
                  <label>
                    <span className="label-text">
                      Opening time <span className="required-asterisk">*</span>
                    </span>
                    <div className="time-input-row">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="7"
                        value={openingStartHour}
                        onChange={(event) =>
                          setOpeningStartHour(event.target.value)
                        }
                      />
                      <select
                        value={openingStartMeridiem}
                        onChange={(event) =>
                          setOpeningStartMeridiem(event.target.value)
                        }
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span className="time-separator">-</span>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="10"
                        value={openingEndHour}
                        onChange={(event) => setOpeningEndHour(event.target.value)}
                      />
                      <select
                        value={openingEndMeridiem}
                        onChange={(event) =>
                          setOpeningEndMeridiem(event.target.value)
                        }
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </label>
                ) : null}
                <label>
                  <span className="label-text">
                    Floor <span className="required-asterisk">*</span>
                  </span>
                  <input
                    placeholder="e.g. 3 (Number only)"
                    value={floor}
                    onChange={(event) => setFloor(event.target.value)}
                    disabled={isOutdoor}
                  />
                </label>
                <label>
                  Outlets
                  <select
                    value={outlet ? "yes" : "no"}
                    onChange={(event) => setOutlet(event.target.value === "yes")}
                    disabled={isOutdoor}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label>
                  Busy level
                  <select
                    value={busyLevel}
                    onChange={(event) => setBusyLevel(event.target.value)}
                  >
                    <option value="n/a">N/A</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  Noise
                  <select
                    value={noiseLevel}
                    onChange={(event) => setNoiseLevel(event.target.value)}
                  >
                    <option value="n/a">N/A</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  Seating
                  <select
                    value={seatingType}
                    onChange={(event) => setSeatingType(event.target.value)}
                  >
                    <option value="chair">Chair</option>
                    <option value="sofa">Sofa</option>
                    <option value="bench">Bench</option>
                    <option value="booth">Booth</option>
                    <option value="pod chair">Pod chair</option>
                    <option value="grass">Grass</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Capacity
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 8 (Number only)"
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                  />
                </label>
                <label>
                  Lighting
                  <select
                    value={lighting}
                    onChange={(event) => setLighting(event.target.value)}
                  >
                    <option value="n/a">N/A</option>
                    <option value="dim">Dim</option>
                    <option value="soft">Soft</option>
                    <option value="natural">Natural</option>
                    <option value="bright">Bright</option>
                  </select>
                </label>
                <label>
                  Temperature
                  <select
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                  >
                    <option value="n/a">N/A</option>
                    <option value="cool">Cool</option>
                    <option value="neutral">Neutral</option>
                    <option value="warm">Warm</option>
                  </select>
                </label>
                <label>
                  WiFi
                  <select value={wifi} onChange={(event) => setWifi(event.target.value)}>
                    <option value="n/a">N/A</option>
                    <option value="strong">Strong</option>
                    <option value="medium">Medium</option>
                    <option value="weak">Weak</option>
                  </select>
                </label>
                <label className="span-2">
                  Description
                  <textarea
                    placeholder="Short description of the spot"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                <label className="span-2">
                  Photo (optional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setPhotoDataUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {photoDataUrl ? (
                  <div className="span-2 photo-preview">
                    <img src={photoDataUrl} alt="Selected preview" />
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setPhotoDataUrl(null)}
                    >
                      Remove photo
                    </button>
                  </div>
                ) : null}
                <label className="span-2">
                  Tags (max 10, single word)
                  <div className="tag-input-row">
                    <input
                      placeholder="quiet"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={handleAddTag}
                    >
                      Add
                    </button>
                  </div>
                  {tags.length ? (
                    <div className="tag-list">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="tag-pill"
                          onClick={() =>
                            setTags((current) =>
                              current.filter((item) => item !== tag)
                            )
                          }
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Submit suggestion"}
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
              <div className="modal-title">Suggest a nap spot!</div>
            </div>
            <div className="modal-body">
              <p>Suggestion sent! It will appear after review.</p>
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
