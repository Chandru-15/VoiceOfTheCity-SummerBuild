import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout.jsx";
import ReportCard from "../../components/ReportCard.jsx";
import AdminReportPanel from "../../components/AdminReportPanel.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAllReports, STATUS_LABELS } from "../2-SubmitReportPage/reportsService.js";
import { DIVISIONS, formatDivisionLabel } from "../../../helpers/rekaAI.js";
import "../2-SubmitReportPage/SubmitReportPage.css";
import "../4-ViewReports-User/ViewReportsUser.jsx";
import "./AdminDashboard.css";

const STATUS_TABS = ["all", "pending_review", "open", "in_progress", "closed", "rejected", "spam"];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusTab, setStatusTab] = useState("pending_review");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      setError(err.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllReports();
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
    return reports.filter((r) => {
      if (statusTab !== "all" && r.status !== statusTab) return false;
      if (divisionFilter !== "all") {
        const division = r.division || r.aiDivision;
        if (division !== divisionFilter) return false;
      }
      return true;
    });
  }, [reports, statusTab, divisionFilter]);

  const counts = useMemo(() => {
    const byStatus = (status) =>
      status === "all" ? reports.length : reports.filter((r) => r.status === status).length;
    return Object.fromEntries(STATUS_TABS.map((tab) => [tab, byStatus(tab)]));
  }, [reports]);

  function handleReportUpdate(updated) {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedReport(updated);
  }

  function handleReportDelete(reportId) {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setSelectedReport(null);
  }

  function tabLabel(tab) {
    if (tab === "all") return "All";
    return STATUS_LABELS[tab] || tab.replace("_", " ");
  }

  return (
    <Layout>
      <div className="list-page admin-page">
        <div className="list-shell admin-layout">
          <p className="report-eyebrow">City staff</p>
          <div className="admin-dashboard-header">
            <div>
              <h1 className="report-heading">Admin dashboard</h1>
              <p className="home-lead" style={{ marginBottom: 0 }}>
                Review pending reports, accept for public visibility, and manage agency routing.
              </p>
            </div>
            <div className="admin-dashboard-user">
              {user?.email && <span className="admin-dashboard-email">{user.email}</span>}
              <button type="button" className="report-btn report-btn--ghost" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>

          <div className="admin-stats">
            <div className="admin-stat">
              <span className="admin-stat-value">{counts.pending_review}</span>
              <span className="admin-stat-label">Pending</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{counts.open}</span>
              <span className="admin-stat-label">Open</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{counts.in_progress}</span>
              <span className="admin-stat-label">In progress</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat-value">{counts.all}</span>
              <span className="admin-stat-label">Total</span>
            </div>
          </div>

          <div className="admin-filters">
            <label className="list-filter">
              Organisation
              <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
                <option value="all">All organisations</option>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDivisionLabel(d)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="report-tabs admin-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                className={`report-tab ${statusTab === tab ? "report-tab--active" : ""}`}
                onClick={() => setStatusTab(tab)}
              >
                {tabLabel(tab)}
                <span className="admin-tab-count">{counts[tab]}</span>
              </button>
            ))}
          </div>

          {loading && (
            <p className="report-status-text report-status-text--loading">Loading reports…</p>
          )}
          {error && (
            <>
              <p className="report-status-text report-status-text--error">{error}</p>
              <button
                className="report-btn report-btn--ghost"
                onClick={loadReports}
                style={{ marginTop: 8 }}
              >
                Retry
              </button>
            </>
          )}

          {!loading && !error && filteredReports.length === 0 && (
            <div className="list-empty">
              <p>No reports match your filters.</p>
            </div>
          )}

          <div className="admin-split">
            <div className="list-grid list-grid--admin">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={selectedReport?.id === report.id ? "admin-report-selected" : ""}
                >
                  <ReportCard
                    report={report}
                    onSelect={setSelectedReport}
                    selected={selectedReport?.id === report.id}
                  />
                </div>
              ))}
            </div>

            {selectedReport && (
              <aside className="admin-detail-panel">
                <button
                  className="list-detail-close"
                  onClick={() => setSelectedReport(null)}
                  aria-label="Close"
                >
                  ×
                </button>
                <AdminReportPanel
                  report={selectedReport}
                  onUpdate={handleReportUpdate}
                  onDelete={handleReportDelete}
                />
              </aside>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
