import { formatIssueLabel } from "../../helpers/rekaAI.js";
import { STATUS_LABELS } from "../Pages/2-SubmitReportPage/reportsService.js";
import DivisionBadge, { PriorityBadge } from "./DivisionBadge.jsx";
import "./ReportCard.css";

export default function ReportCard({ report, onSelect, selected, showActions, onStatusChange }) {
  const imageUrl = report.images?.[0];
  const locationLabel =
    report.location?.address ||
    (report.location
      ? `${report.location.lat?.toFixed(4)}, ${report.location.lng?.toFixed(4)}`
      : "Unknown location");

  return (
    <article
      className={`report-card${selected ? " report-card--selected" : ""}${onSelect ? " report-card--clickable" : ""}`}
      onClick={onSelect ? () => onSelect(report) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(report);
              }
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {imageUrl && <img src={imageUrl} alt="" className="report-card-image" />}
      <div className="report-card-body">
        <div className="report-card-header">
          <h3 className="report-card-title">{formatIssueLabel(report.issueType)}</h3>
          <span className={`report-badge report-badge--${report.severity}`}>{report.severity}</span>
        </div>
        {report.description && <p className="report-card-desc">{report.description}</p>}
        {(report.division || report.aiDivision) && (
          <DivisionBadge
            division={report.division || report.aiDivision}
            reason={report.divisionSource === "ai" ? report.divisionReason : undefined}
            compact
          />
        )}
        <p className="report-card-meta">{locationLabel}</p>
        <div className="report-card-footer">
          <span className={`report-status report-status--${report.status || "open"}`}>
            {STATUS_LABELS[report.status] || report.status || "Open"}
          </span>
          <div className="report-card-footer-right">
            <PriorityBadge priority={report.priority} isEmergency={report.isEmergency} />
            <span className="report-card-count">
              {report.count || 1} report{(report.count || 1) > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {showActions && onStatusChange && (
          <div className="report-card-actions" onClick={(e) => e.stopPropagation()}>
            {report.status !== "in_progress" && (
              <button
                className="report-btn report-btn--ghost"
                onClick={() => onStatusChange(report.id, "in_progress")}
              >
                Mark in progress
              </button>
            )}
            {report.status !== "closed" && (
              <button
                className="report-btn report-btn--primary"
                onClick={() => onStatusChange(report.id, "closed")}
              >
                Close
              </button>
            )}
            {report.status !== "open" && (
              <button
                className="report-btn report-btn--ghost"
                onClick={() => onStatusChange(report.id, "open")}
              >
                Reopen
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
