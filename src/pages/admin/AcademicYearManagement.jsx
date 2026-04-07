import { useEffect, useState } from "react";
import "../../styles/admin.shared.css";
import "../../styles/AcademicYearManagement.css";
import {
  createAcademicYear,
  getAcademicYears,
  updateAcademicYear,
} from "../../services/academicYearService";

var EMPTY_FORM = { year_label: "", idea_closure_date: "", final_closure_date: "" };

// ── MOCK DATA (dùng khi API chưa sẵn sàng) ──────────────────────────────────
var USE_MOCK = false; // đổi thành true để dùng mock, false để gọi API thật

var MOCK_ACADEMIC_YEARS = [
  { year_id: 1, year_label: "2021-2022", idea_closure_date: "2022-03-31", final_closure_date: "2022-04-30", created_at: "2021-08-01", status: "closed"   },
  { year_id: 2, year_label: "2022-2023", idea_closure_date: "2023-03-31", final_closure_date: "2023-04-30", created_at: "2022-08-01", status: "closed"   },
  { year_id: 3, year_label: "2023-2024", idea_closure_date: "2024-03-31", final_closure_date: "2024-04-30", created_at: "2023-08-01", status: "closed"   },
  { year_id: 4, year_label: "2024-2025", idea_closure_date: "2025-03-31", final_closure_date: "2025-04-30", created_at: "2024-08-01", status: "active"   },
];

function mapStatus(year) {
  if (year.ideaOpen === true) return "active";
  if (year.ideaOpen === false && year.commentOpen === true) return "upcoming";
  return "closed";
}

function normalizeAcademicYear(year) {
  return {
    year_id: year.yearId,
    year_label: year.yearLabel || "",
    idea_closure_date: year.ideaClosureDate || "",
    final_closure_date: year.finalClosureDate || "",
    created_at: year.createdAt ? String(year.createdAt).split("T")[0] : "",
    status: mapStatus(year),
  };
}

function getStatusInfo(status) {
  if (status === "active") return { label: "Active", cls: "badge--active" };
  if (status === "upcoming") return { label: "Upcoming", cls: "badge--manager" };
  return { label: "Closed", cls: "badge--inactive" };
}

var IconClose = function() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
};

var AcademicYearManagement = function() {
  var yearsState = useState([]);
  var years = yearsState[0];
  var setYears = yearsState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var submitState = useState(false);
  var submitting = submitState[0];
  var setSubmitting = submitState[1];

  var pageErrorState = useState("");
  var pageError = pageErrorState[0];
  var setPageError = pageErrorState[1];

  var addState = useState(false);
  var showAdd = addState[0];
  var setShowAdd = addState[1];

  var editState = useState(false);
  var showEdit = editState[0];
  var setShowEdit = editState[1];

  var selState = useState(null);
  var selectedYear = selState[0];
  var setSelectedYear = selState[1];

  var formState = useState(EMPTY_FORM);
  var form = formState[0];
  var setForm = formState[1];

  var errState = useState({});
  var errors = errState[0];
  var setErrors = errState[1];

  var activeYear = years.find(function(y) { return y.status === "active"; });

  useEffect(function() {
    fetchAcademicYears();
  }, []);

  async function fetchAcademicYears() {
    setLoading(true);
    setPageError("");
    try {
      if (USE_MOCK) {
        // Dùng mock data — xóa block này khi API sẵn sàng
        await new Promise(function(r) { setTimeout(r, 300); });
        setYears(MOCK_ACADEMIC_YEARS);
      } else {
        var response = await getAcademicYears();
        setYears(Array.isArray(response) ? response.map(normalizeAcademicYear) : []);
      }
    } catch (error) {
      setPageError(error?.response?.data?.message || error?.message || "Failed to load academic years.");
      setYears([]);
    } finally {
      setLoading(false);
    }
  }

  function setField(field) {
    return function(e) {
      var val = e.target.value;
      setForm(function(f) {
        return Object.assign({}, f, { [field]: val });
      });
    };
  }

  function validate() {
    var errs = {};
    if (!form.year_label.trim()) errs.year_label = "year_label is required";
    if (!form.idea_closure_date) errs.idea_closure_date = "idea_closure_date is required";
    if (!form.final_closure_date) errs.final_closure_date = "final_closure_date is required";
    if (form.idea_closure_date && form.final_closure_date) {
      if (new Date(form.final_closure_date) <= new Date(form.idea_closure_date)) {
        errs.final_closure_date = "final_closure_date must be after idea_closure_date";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setErrors({});
    setPageError("");
    setShowAdd(true);
  }

  function openEdit(y) {
    setSelectedYear(y);
    setForm({
      year_label: y.year_label,
      idea_closure_date: y.idea_closure_date,
      final_closure_date: y.final_closure_date,
    });
    setErrors({});
    setPageError("");
    setShowEdit(true);
  }

  async function handleAdd() {
    if (!validate()) return;
    setSubmitting(true);
    setPageError("");
    try {
      var created = await createAcademicYear({
        yearLabel: form.year_label.trim(),
        ideaClosureDate: form.idea_closure_date,
        finalClosureDate: form.final_closure_date,
      });
      setYears(function(prev) {
        return [normalizeAcademicYear(created)].concat(prev);
      });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      setPageError(error?.response?.data?.message || error?.message || "Failed to create academic year.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!validate()) return;
    if (!selectedYear) return;
    setSubmitting(true);
    setPageError("");
    try {
      var updated = await updateAcademicYear(selectedYear.year_id, {
        yearLabel: form.year_label.trim(),
        ideaClosureDate: form.idea_closure_date,
        finalClosureDate: form.final_closure_date,
      });
      setYears(function(prev) {
        return prev.map(function(y) {
          return y.year_id === selectedYear.year_id ? normalizeAcademicYear(updated) : y;
        });
      });
      setShowEdit(false);
      setSelectedYear(null);
      setErrors({});
    } catch (error) {
      setPageError(error?.response?.data?.message || error?.message || "Failed to update academic year.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="academic-mgmt">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Academic Year Management</h1>
          <p>Manage academic years, idea closure dates, and final closure dates</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Academic Year
        </button>
      </div>

      {pageError && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ color: "#dc2626" }}>{pageError}</div>
        </div>
      )}

      {activeYear && (
        <div className="active-year-banner">
          <div className="active-year-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="active-year-info">
            <div className="active-year-label">Current Active Year</div>
            <div className="active-year-name">{activeYear.year_label}</div>
          </div>
          <div className="active-year-dates">
            <div className="active-year-date-item">
              <span>idea_closure_date:</span>
              <strong>{activeYear.idea_closure_date}</strong>
            </div>
            <div className="active-year-date-item">
              <span>final_closure_date:</span>
              <strong>{activeYear.final_closure_date}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div><div className="stat-val">{years.length}</div><div className="stat-label">Total Years</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div><div className="stat-val">{years.filter(function(y) { return y.status === "active"; }).length}</div><div className="stat-label">Active</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <div><div className="stat-val">{years.filter(function(y) { return y.status === "upcoming"; }).length}</div><div className="stat-label">Upcoming</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--sky">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <div><div className="stat-val">{years.filter(function(y) { return y.status === "closed"; }).length}</div><div className="stat-label">Closed</div></div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header"><span className="card-title">Academic Year List</span></div>
        <div className="table-wrapper">
          {loading ? (
            <div className="card-body">Loading academic years...</div>
          ) : years.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <h3>No academic years found</h3>
              <p>Create an academic year to get started.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>year_label</th>
                  <th>idea_closure_date</th>
                  <th>final_closure_date</th>
                  <th>created_at</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {years.map(function(year) {
                  var st = getStatusInfo(year.status);
                  return (
                    <tr key={year.year_id} className={year.status === "active" ? "row-active" : ""}>
                      <td>
                        <div className="year-label-cell">
                          {year.status === "active" && <span className="active-dot" />}
                          <span className="year-label-text">{year.year_label}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          {year.idea_closure_date}
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          {year.final_closure_date}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{year.created_at}</td>
                      <td><span className={"badge " + st.cls}>{st.label}</span></td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={function() { openEdit(year); }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={function() { if (!submitting) setShowAdd(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h2>Add New Academic Year</h2>
              <button className="modal-close" onClick={function() { setShowAdd(false); }} disabled={submitting}><IconClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">year_label <span>*</span></label>
                <input className="form-control" placeholder="e.g. 2025-2026" value={form.year_label} onChange={setField("year_label")} />
                {errors.year_label && <div className="form-error">{errors.year_label}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">idea_closure_date <span>*</span></label>
                  <input type="date" className="form-control" value={form.idea_closure_date} onChange={setField("idea_closure_date")} />
                  {errors.idea_closure_date && <div className="form-error">{errors.idea_closure_date}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">final_closure_date <span>*</span></label>
                  <input type="date" className="form-control" value={form.final_closure_date} min={form.idea_closure_date} onChange={setField("final_closure_date")} />
                  {errors.final_closure_date && <div className="form-error">{errors.final_closure_date}</div>}
                </div>
              </div>
              <div className="date-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                final_closure_date must be after idea_closure_date
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={function() { setShowAdd(false); }} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>{submitting ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="modal-overlay" onClick={function() { if (!submitting) setShowEdit(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h2>Update Academic Year</h2>
              <button className="modal-close" onClick={function() { setShowEdit(false); }} disabled={submitting}><IconClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">year_label</label>
                <input className="form-control" value={form.year_label} onChange={setField("year_label")} />
                {errors.year_label && <div className="form-error">{errors.year_label}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">idea_closure_date</label>
                  <input type="date" className="form-control" value={form.idea_closure_date} onChange={setField("idea_closure_date")} />
                  {errors.idea_closure_date && <div className="form-error">{errors.idea_closure_date}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">final_closure_date <span>*</span></label>
                  <input type="date" className="form-control" value={form.final_closure_date} min={form.idea_closure_date} onChange={setField("final_closure_date")} />
                  {errors.final_closure_date && <div className="form-error">{errors.final_closure_date}</div>}
                </div>
              </div>
              <div className="date-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                final_closure_date must be after idea_closure_date
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={function() { setShowEdit(false); }} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManagement;