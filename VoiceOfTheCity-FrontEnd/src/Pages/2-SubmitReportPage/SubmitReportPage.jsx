import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { analyzeReportImage, formatIssueLabel } from "../../../helpers/rekaAI.js";
import { uploadImageToCloudinary } from "../../../helpers/cloudinary.js";
import { validateImageFreshness } from "../../../helpers/imageMetadata.js";
import {
  findSimilarReports,
  createReport,
  mergeIntoReport,
  SEVERITY_RANK,
} from "./reportsService.js";
import { geocodeAddress, reverseGeocode } from "./GoogleMaps.js";
import Layout from "../../components/Layout.jsx";
import DivisionBadge, { PriorityBadge, EmergencyNotice } from "../../components/DivisionBadge.jsx";
import "./SubmitReportPage.css";

const MAX_PHOTOS = 5;

function Step({ number, title, status, hint, children }) {
  return (
    <section className={`report-step report-step--${status}`}>
      <div className="report-step-marker" aria-hidden="true">
        {status === "done" ? "✓" : number}
      </div>
      <div className="report-step-body">
        <h2 className="report-step-title">{title}</h2>
        {hint && <p className="report-step-hint">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

function SeverityBadge({ severity }) {
  return <span className={`report-badge report-badge--${severity}`}>{severity}</span>;
}

const SubmitReportPage = () => {
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [locationMethod, setLocationMethod] = useState("search");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  const [pipelineStatus, setPipelineStatus] = useState("idle");
  const [pipelineError, setPipelineError] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [candidateMatches, setCandidateMatches] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  async function handleConfirmAddress() {
    if (!addressQuery.trim()) {
      setLocationStatus("error");
      setLocationError("Enter an address first.");
      return;
    }

    setGeocodeLoading(true);
    setLocationError("");
    setLocationStatus("loading");

    try {
      const resolved = await geocodeAddress(addressQuery);
      setLocation(resolved);
      setAddressQuery(resolved.address || addressQuery);
      setLocationStatus("success");
    } catch (err) {
      setLocationStatus("error");
      setLocationError(err.message || "Could not find that address.");
    } finally {
      setGeocodeLoading(false);
    }
  }

  function resetPipelineState() {
    setPipelineStatus("idle");
    setPipelineError("");
    setUploadedImageUrls([]);
    setAnalysis(null);
    setCandidateMatches([]);
    setResult(null);
  }

  async function addPhotos(fileList) {
    if (!fileList?.length) return;
    setPhotoError("");

    const slotsLeft = MAX_PHOTOS - photos.length;
    if (slotsLeft <= 0) {
      setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const accepted = [];
    const errors = [];

    for (const file of Array.from(fileList).slice(0, slotsLeft)) {
      const validation = await validateImageFreshness(file);
      if (!validation.ok) {
        errors.push(validation.reason);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        takenAt: validation.takenAt,
      });
    }

    if (accepted.length) {
      setPhotos((prev) => [...prev, ...accepted]);
      resetPipelineState();
    }
    if (errors.length) {
      setPhotoError(errors[0]);
    }
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    resetPipelineState();
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Location is not supported on this device.");
      return;
    }
    setLocationStatus("loading");
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let address = null;
        try {
          address = await reverseGeocode(lat, lng);
        } catch {
          // Non-fatal — coordinates are enough to file the report.
        }
        setLocation({ lat, lng, address });
        setLocationStatus("success");
      },
      (err) => {
        setLocationStatus("error");
        setLocationError(
          err.code === 1
            ? "Location permission was denied. Enable it in your browser settings and try again."
            : "Could not get your location. Try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function finalizeNewReport(imageUrls, imageMetadata, analysisResult) {
    setPipelineStatus("finalizing");
    try {
      const id = await createReport({
        imageUrls,
        imageMetadata,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        issueType: analysisResult.issueType,
        severity: analysisResult.severity,
        description: analysisResult.description,
        division: analysisResult.division,
        divisionReason: analysisResult.divisionReason,
        priority: analysisResult.priority,
        isEmergency: analysisResult.isEmergency,
      });
      setResult({
        reportId: id,
        isNew: true,
        count: 1,
        division: analysisResult.division,
        divisionReason: analysisResult.divisionReason,
        priority: analysisResult.priority,
        isEmergency: analysisResult.isEmergency,
      });
      setPipelineStatus("success");
    } catch (err) {
      setPipelineStatus("error");
      setPipelineError(err.message || "Could not submit the report. Please try again.");
    }
  }

  async function handleStartPipeline() {
    if (!photos.length || !location) return;
    setPipelineError("");
    setPipelineStatus("uploading");

    try {
      const urls = await Promise.all(photos.map((p) => uploadImageToCloudinary(p.file)));
      setUploadedImageUrls(urls);

      const imageMetadata = photos.map((p) => ({
        takenAt: p.takenAt,
        uploadedAt: new Date().toISOString(),
      }));

      setPipelineStatus("analyzing");
      const analysisResult = await analyzeReportImage(urls[0], location);
      setAnalysis(analysisResult);

      setPipelineStatus("checking");
      const matches = await findSimilarReports({
        issueType: analysisResult.issueType,
        lat: location.lat,
        lng: location.lng,
      });

      if (matches.length > 0) {
        setCandidateMatches(matches);
        setPipelineStatus("awaiting_confirmation");
      } else {
        await finalizeNewReport(urls, imageMetadata, analysisResult);
      }
    } catch (err) {
      setPipelineStatus("error");
      setPipelineError(err.message || "Something went wrong. Please try again.");
    }
  }

  async function handleConfirmSameEvent() {
    const topMatch = candidateMatches[0];
    if (!topMatch || !uploadedImageUrls.length || !analysis) return;
    setPipelineStatus("finalizing");
    try {
      const imageMetadata = photos.map((p) => ({
        takenAt: p.takenAt,
        uploadedAt: new Date().toISOString(),
      }));
      const resolvedSeverity =
        SEVERITY_RANK[analysis.severity] > SEVERITY_RANK[topMatch.severity]
          ? analysis.severity
          : topMatch.severity;
      await mergeIntoReport(topMatch.id, {
        imageUrls: uploadedImageUrls,
        imageMetadata,
        severity: resolvedSeverity,
        division: analysis.division,
        divisionReason: analysis.divisionReason,
        priority: analysis.priority,
      });
      setResult({
        reportId: topMatch.id,
        isNew: false,
        count: (topMatch.count || 1) + 1,
        division: topMatch.division || analysis.division,
        divisionReason: analysis.divisionReason,
        priority: analysis.priority,
        isEmergency: analysis.isEmergency,
      });
      setPipelineStatus("success");
    } catch (err) {
      setPipelineStatus("error");
      setPipelineError(
        err.message || "Could not merge with the existing report. Please try again.",
      );
    }
  }

  function handleConfirmDifferentEvent() {
    const imageMetadata = photos.map((p) => ({
      takenAt: p.takenAt,
      uploadedAt: new Date().toISOString(),
    }));
    finalizeNewReport(uploadedImageUrls, imageMetadata, analysis);
  }

  function handleReset() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setPhotoError("");
    setLocation(null);
    setLocationStatus("idle");
    setLocationError("");
    setAddressQuery("");
    resetPipelineState();
  }

  const hasPhotos = photos.length > 0;
  const locationStepStatus = !hasPhotos ? "pending" : location ? "done" : "active";
  const pipelineStepStatus = !(hasPhotos && location)
    ? "pending"
    : pipelineStatus === "success"
      ? "done"
      : "active";
  const isPipelineBusy = ["uploading", "analyzing", "checking", "finalizing"].includes(
    pipelineStatus,
  );

  if (pipelineStatus === "success" && result) {
    return (
      <Layout>
        <div className="report-page">
          <div className="report-confirm-inner">
            <div className="report-confirm-mark" aria-hidden="true">
              ✓
            </div>
            <h1 className="report-confirm-title">
              {result.isNew ? "Report submitted" : "Added to existing report"}
            </h1>
            <p className="report-confirm-lead">
              {result.isNew
                ? "Thanks — your report is pending admin review. It will appear publicly once accepted."
                : `Your photo confirmed an issue others already reported. It now has ${result.count} reports.`}
            </p>
            <p className="report-confirm-id">REPORT ID: {result.reportId}</p>

            {result.division && (
              <div className="report-confirm-routed">
                <p className="report-confirm-routed-label">Routed to agency</p>
                <div className="report-confirm-routed-card">
                  <DivisionBadge division={result.division} reason={result.divisionReason}as />
                </div>
                <div className="report-confirm-priority">
                  <PriorityBadge priority={result.priority} isEmergency={result.isEmergency} />
                </div>
                <EmergencyNotice isEmergency={result.isEmergency} />
              </div>
            )}

            <div className="report-confirm-actions">
              <button className="report-btn report-btn--primary" onClick={handleReset}>
                Report another issue
              </button>
              <Link to="/viewreports" className="report-btn">
                Community Reports
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="report-page">
        <div className="report-shell">
          <p className="report-eyebrow">Civic Report</p>
          <h1 className="report-heading">Report a street issue</h1>

          <Step number={1} title="Add photos" status={hasPhotos ? "done" : "active"}>
            {photos.length > 0 && (
              <div className="report-photo-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="report-photo-item">
                    <img src={photo.previewUrl} alt="Selected report photo" />
                    <button
                      type="button"
                      className="report-photo-remove"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="report-step-hint">
              Add up to {MAX_PHOTOS} recent photos (taken within the last 7 days).
              {photos.length > 0 && ` ${photos.length}/${MAX_PHOTOS} selected.`}
            </p>
            {photoError && (
              <p className="report-status-text report-status-text--error">{photoError}</p>
            )}
            <div className="report-btn-row">
              <button
                className="report-btn"
                onClick={() => cameraInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
              >
                Take photo
              </button>
              <button
                className="report-btn report-btn--ghost"
                onClick={() => galleryInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
              >
                Upload photos
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="report-visually-hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="report-visually-hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </Step>

          <Step
            number={2}
            title="Enter the location"
            status={locationStepStatus}
            hint={locationStepStatus === "pending" ? "Add at least one photo first." : undefined}
          >
            {locationStepStatus !== "pending" && (
              <>
                <div className="report-tabs">
                  <button
                    className={`report-tab ${locationMethod === "search" ? "report-tab--active" : ""}`}
                    onClick={() => setLocationMethod("search")}
                  >
                    Search address
                  </button>
                  <button
                    className={`report-tab ${locationMethod === "gps" ? "report-tab--active" : ""}`}
                    onClick={() => setLocationMethod("gps")}
                  >
                    Use GPS
                  </button>
                </div>

                <div style={{ display: locationMethod === "search" ? "block" : "none" }}>
                  <p className="report-step-hint">
                    Type a street address with city and postal code, then press Enter or Confirm.
                  </p>
                  <div className="report-address-form">
                    <input
                      type="text"
                      className="report-input"
                      placeholder="e.g. 50 Nanyang Ave, Singapore 639798"
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        if (location) {
                          setLocation(null);
                          setLocationStatus("idle");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmAddress();
                        }
                      }}
                      disabled={geocodeLoading}
                    />
                    <button
                      className="report-btn report-btn--primary"
                      onClick={handleConfirmAddress}
                      disabled={geocodeLoading || !addressQuery.trim()}
                    >
                      {geocodeLoading ? "Looking up…" : "Confirm address"}
                    </button>
                  </div>
                </div>

                {locationMethod === "gps" && (
                  <button
                    className="report-btn"
                    onClick={handleUseGps}
                    disabled={locationStatus === "loading"}
                  >
                    {locationStatus === "loading" ? "Getting location…" : "Use my GPS location"}
                  </button>
                )}

                {locationStatus === "error" && (
                  <p className="report-status-text report-status-text--error">{locationError}</p>
                )}

                {location && (
                  <p className="report-coords" style={{ marginTop: 10 }}>
                    {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                  </p>
                )}
              </>
            )}
          </Step>

          <Step
            number={3}
            title="Upload & analyze"
            status={pipelineStepStatus}
            hint={pipelineStepStatus === "pending" ? "Add photos and location first." : undefined}
          >
            {pipelineStatus === "idle" && pipelineStepStatus !== "pending" && (
              <button className="report-btn report-btn--primary" onClick={handleStartPipeline}>
                Upload & analyze {photos.length > 1 ? `${photos.length} photos` : "photo"}
              </button>
            )}

            {pipelineStatus === "uploading" && (
              <p className="report-status-text report-status-text--loading">
                Uploading {photos.length > 1 ? `${photos.length} photos` : "photo"} to Cloudinary
              </p>
            )}
            {pipelineStatus === "analyzing" && (
              <p className="report-status-text report-status-text--loading">
                Reka AI is reading the photo
              </p>
            )}
            {pipelineStatus === "checking" && (
              <p className="report-status-text report-status-text--loading">
                Checking for similar reports nearby
              </p>
            )}
            {pipelineStatus === "finalizing" && (
              <p className="report-status-text report-status-text--loading">Saving report</p>
            )}

            {pipelineStatus === "error" && (
              <>
                <p className="report-status-text report-status-text--error">{pipelineError}</p>
                <button
                  className="report-btn report-btn--ghost"
                  onClick={handleStartPipeline}
                  style={{ marginTop: 8 }}
                >
                  Try again
                </button>
              </>
            )}

            {pipelineStatus === "awaiting_confirmation" && analysis && candidateMatches[0] && (
              <>
                <div className="report-ticket" style={{ marginBottom: 14 }}>
                  <div className="report-ticket-row">
                    <div>
                      <p className="report-ticket-issue">{formatIssueLabel(analysis.issueType)}</p>
                      <p className="report-ticket-desc">{analysis.description}</p>
                    </div>
                    <SeverityBadge severity={analysis.severity} />
                  </div>
                  <div style={{ marginTop: 12, marginLeft: 22 }}>
                    <DivisionBadge
                      division={analysis.division}
                      reason={analysis.divisionReason}
                      compact
                    />
                    <div style={{ marginTop: 8 }}>
                      <PriorityBadge
                        priority={analysis.priority}
                        isEmergency={analysis.isEmergency}
                      />
                    </div>
                    <EmergencyNotice isEmergency={analysis.isEmergency} />
                  </div>
                </div>

                <p className="report-step-hint">
                  A similar report was already filed {candidateMatches[0].distanceMeters}m away
                  {candidateMatches.length > 1
                    ? ` (and ${candidateMatches.length - 1} other${candidateMatches.length > 2 ? "s" : ""} nearby)`
                    : ""}
                  :
                </p>

                <div className="report-match-card">
                  {candidateMatches[0].images?.[0] && (
                    <img
                      src={candidateMatches[0].images[0]}
                      alt=""
                      className="report-radio-thumb"
                    />
                  )}
                  <span className="report-radio-meta">
                    <p className="report-radio-title">
                      {formatIssueLabel(candidateMatches[0].issueType)}
                    </p>
                    <p className="report-radio-sub">
                      {candidateMatches[0].count} report{candidateMatches[0].count > 1 ? "s" : ""}{" "}
                      so far · {candidateMatches[0].severity} severity
                    </p>
                  </span>
                </div>

                <p className="report-step-hint" style={{ marginTop: 12, fontWeight: 600 }}>
                  Is this the same issue you&apos;re reporting?
                </p>
                <div className="report-btn-row">
                  <button
                    className="report-btn report-btn--primary"
                    onClick={handleConfirmSameEvent}
                  >
                    Yes, same issue
                  </button>
                  <button
                    className="report-btn report-btn--ghost"
                    onClick={handleConfirmDifferentEvent}
                  >
                    No, different issue
                  </button>
                </div>
              </>
            )}

            {isPipelineBusy && (
              <p className="report-step-hint" style={{ marginTop: 8 }}>
                This won&apos;t take long.
              </p>
            )}
          </Step>
        </div>
      </div>
    </Layout>
  );
};

export default SubmitReportPage;