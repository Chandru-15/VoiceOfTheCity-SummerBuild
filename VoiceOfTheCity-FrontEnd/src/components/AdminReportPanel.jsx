import { useState, useEffect } from "react";
import {
  DIVISIONS,
  DEFAULT_DIVISION,
  formatDivisionLabel,
  formatIssueLabel,
  generateAdminReport,
} from "../../helpers/rekaAI.js";
import {
  REPORT_STATUSES,
  STATUS_LABELS,
  SEVERITIES,
  updateReportStatus,
  updateReportSeverity,
  updateReportDivision,
  deleteReport,
  saveAdminReport,
} from "../Pages/2-SubmitReportPage/reportsService.js";
import DivisionBadge, { PriorityBadge, EmergencyNotice } from "./DivisionBadge.jsx";
import "../Pages/2-SubmitReportPage/SubmitReportPage.css";
import "./AdminReportPanel.css";

export default function AdminReportPanel({ report, onUpdate, onDelete }) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(
    report.division || report.aiDivision || DEFAULT_DIVISION,
  );
  const [selectedSeverity, setSelectedSeverity] = useState(report.severity || "medium");
  const [selectedStatus, setSelectedStatus] = useState(report.status || "pending_review");

  useEffect(() => {
    setSelectedDivision(report.division || report.aiDivision || DEFAULT_DIVISION);
    setSelectedSeverity(report.severity || "medium");
    setSelectedStatus(report.status || "pending_review");
  }, [report.id, report.division, report.aiDivision, report.severity, report.status]);

  const adminReport = report.adminReport;
  const locationLabel =
    report.location?.address ||
    (report.location
      ? `${report.location.lat?.toFixed(5)}, ${report.location.lng?.toFixed(5)}`
      : "Unknown");

  async function handleGenerateReport() {
    setGenerating(true);
    setError("");
    try {
      const generated = await generateAdminReport(report);
      await saveAdminReport(report.id, generated);
      onUpdate({ ...report, adminReport: generated });
    } catch (err) {
      setError(err.message || "Could not generate admin report.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDivisionChange(division) {
    setSelectedDivision(division);
    setSaving(true);
    setError("");
    try {
      await updateReportDivision(report.id, division);
      onUpdate({ ...report, division, divisionSource: "human" });
    } catch (err) {
      setError(err.message || "Could not update agency.");
      setSelectedDivision(report.division || report.aiDivision);
    } finally {
      setSaving(false);
    }
  }

  async function handleSeverityChange(severity) {
    setSelectedSeverity(severity);
    setSaving(true);
    setError("");
    try {
      await updateReportSeverity(report.id, severity);
      onUpdate({ ...report, severity });
    } catch (err) {
      setError(err.message || "Could not update severity.");
      setSelectedSeverity(report.severity);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status) {
    setSelectedStatus(status);
    setSaving(true);
    setError("");
    try {
      await updateReportStatus(report.id, status);
      onUpdate({ ...report, status });
    } catch (err) {
      setError(err.message || "Could not update status.");
      setSelectedStatus(report.status);
    } finally {
      setSaving(false);
    }
  }

  async function handleAccept() {
    await handleStatusChange("open");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this report permanently? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      await deleteReport(report.id);
      onDelete?.(report.id);
    } catch (err) {
      setError(err.message || "Could not delete report.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-report-panel">
      <div className="admin-report-panel-header">
        <div>
          <h3 className="admin-report-panel-title">{formatIssueLabel(report.issueType)}</h3>
          <p className="report-card-meta">{locationLabel}</p>
        </div>
        <PriorityBadge priority={report.priority} isEmergency={report.isEmergency} />
      </div>

      {report.isEmergency && <EmergencyNotice isEmergency />}

      {report.images?.length > 0 && (
        <div className="admin-report-section">
          <h4 className="admin-report-section-title">Photos ({report.images.length})</h4>
          <div className="report-photo-grid report-photo-grid--compact">
            {report.images.map((url) => (
              <div key={url} className="report-photo-item">
                <img src={url} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-report-section">
        <h4 className="admin-report-section-title">Review controls</h4>
        <div className="admin-control-grid">
          <label className="list-filter">
            Status
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={saving}
            >
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="list-filter">
            Severity
            <select
              value={selectedSeverity}
              onChange={(e) => handleSeverityChange(e.target.value)}
              disabled={saving}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="list-filter">
            Organisation
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              disabled={saving}
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDivisionLabel(d)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {report.status === "pending_review" && (
          <button
            className="report-btn report-btn--primary"
            onClick={handleAccept}
            disabled={saving}
            style={{ marginTop: 12 }}
          >
            Accept & publish
          </button>
        )}
      </div>

      <div className="admin-report-section">
        <h4 className="admin-report-section-title">Agency routing</h4>
        <DivisionBadge
          division={report.aiDivision || report.division}
          reason={report.divisionReason}
        />
        {report.divisionSource === "human" && report.division !== report.aiDivision && (
          <p className="report-step-hint">
            Admin override active — AI suggested {formatDivisionLabel(report.aiDivision)}.
          </p>
        )}
      </div>

      <div className="admin-report-section">
        <div className="admin-report-section-head">
          <h4 className="admin-report-section-title">AI admin briefing</h4>
          <button
            className="report-btn report-btn--ghost"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? "Generating…" : adminReport ? "Regenerate" : "Generate report"}
          </button>
        </div>

        {error && <p className="report-status-text report-status-text--error">{error}</p>}

        {!adminReport && !generating && (
          <p className="report-step-hint">
            No briefing yet. Generate one for a full assessment, recommended actions, and safety
            notes.
          </p>
        )}

        {adminReport && (
          <div className="admin-briefing">
            <div className="admin-briefing-block">
              <h5>Summary</h5>
              <p>{adminReport.summary}</p>
            </div>
            <div className="admin-briefing-block">
              <h5>Detailed assessment</h5>
              <p>{adminReport.detailedAssessment}</p>
            </div>
            {adminReport.recommendedActions?.length > 0 && (
              <div className="admin-briefing-block">
                <h5>Recommended actions</h5>
                <ul>
                  {adminReport.recommendedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="admin-briefing-block">
              <h5>Urgency justification</h5>
              <p>{adminReport.urgencyJustification}</p>
            </div>
            <div className="admin-briefing-block">
              <h5>Division rationale</h5>
              <p>{adminReport.divisionRationale}</p>
            </div>
            <div className="admin-briefing-block">
              <h5>Public safety notes</h5>
              <p>{adminReport.publicSafetyNotes}</p>
            </div>
            <div className="admin-briefing-block">
              <h5>Estimated impact</h5>
              <p>{adminReport.estimatedImpact}</p>
            </div>
          </div>
        )}
      </div>

      <div className="admin-report-actions">
        <p className="report-ticket-id">Report ID: {report.id}</p>
        <button
          className="report-btn report-btn--danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete report"}
        </button>
      </div>
    </div>
  );
}
