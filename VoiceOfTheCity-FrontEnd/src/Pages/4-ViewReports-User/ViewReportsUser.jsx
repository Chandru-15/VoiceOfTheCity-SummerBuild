import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout.jsx";
import ReportCard from "../../components/ReportCard.jsx";
import {
  getPublicReports,
  STATUS_LABELS,
  PUBLIC_STATUSES,
} from "../2-SubmitReportPage/reportsService.js";
import { ISSUE_TYPES, formatIssueLabel } from "../../../helpers/rekaAI.js";
import "./ViewReportsUser.css";

const STATUS_OPTIONS = ["all", ...PUBLIC_STATUSES];

const ViewReportsUser = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPublicReports();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (issueFilter !== "all" && report.issueType !== issueFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          report.description,
          report.location?.address,
          formatIssueLabel(report.issueType),
          report.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reports, statusFilter, issueFilter, searchQuery]);

  return (
    <Layout>
      <div className="list-page">
        <div className="list-shell">
          <p className="report-eyebrow">Community</p>
          <h1 className="report-heading">Community Reports</h1>
          <p className="home-lead" style={{ marginBottom: 20 }}>
            Admin-approved issues reported by residents across Singapore.
          </p>

          <div className="list-filters">
            <input
              type="search"
              className="list-search"
              placeholder="Search by address, description, or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="list-filter-row">
              <label className="list-filter">
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All statuses" : STATUS_LABELS[s] || s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="list-filter">
                Issue type
                <select value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}>
                  <option value="all">All types</option>
                  {ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatIssueLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading && (
            <p className="report-status-text report-status-text--loading">Loading reports…</p>
          )}
          {error && <p className="report-status-text report-status-text--error">{error}</p>}

          {!loading && !error && filteredReports.length === 0 && (
            <div className="list-empty">
              <p>No approved reports match your filters yet.</p>
            </div>
          )}

          <div className="list-grid">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onSelect={setSelectedReport}
                selected={selectedReport?.id === report.id}
              />
            ))}
          </div>

          {selectedReport && (
            <aside className="list-detail" aria-label="Report details">
              <button
                className="list-detail-close"
                onClick={() => setSelectedReport(null)}
                aria-label="Close"
              >
                ×
              </button>
              <ReportCard report={selectedReport} />
              {selectedReport.images?.length > 1 && (
                <div className="list-detail-gallery">
                  {selectedReport.images.slice(1).map((url) => (
                    <img key={url} src={url} alt="" className="list-detail-thumb" />
                  ))}
                </div>
              )}
              <p className="report-ticket-id">ID: {selectedReport.id}</p>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ViewReportsUser;
