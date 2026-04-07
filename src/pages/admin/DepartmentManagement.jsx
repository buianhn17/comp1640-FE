import { useEffect, useMemo, useState } from "react";
import "../../styles/admin.shared.css";
import "../../styles/DepartmentManagement.css";
import { getDepartments, createDepartment, updateDepartment } from "../../services/departmentService";
import { getUsers } from "../../services/userService";

// ── Schema: department { dept_id, dept_name, dept_type, created_at }

var DEPT_TYPES = ["Technical", "Business", "Support", "Creative", "Management"];

var TYPE_BADGE = {
  Technical: "badge--admin",
  Business: "badge--manager",
  Support: "badge--staff",
  Creative: "badge--coordinator",
  Management: "badge--active",
};

var EMPTY_FORM = { dept_name: "", dept_type: "" };

function formatDate(value) {
  if (!value) return "";
  var date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0];
  }
  return date.toISOString().split("T")[0];
}

function normalizeDepartment(dept, memberCountMap) {
  var count = memberCountMap && typeof memberCountMap[dept.deptId] === "number" ? memberCountMap[dept.deptId] : 0;
  return {
    dept_id: dept.deptId,
    dept_name: dept.deptName || "",
    dept_type: dept.deptType || "",
    created_at: formatDate(dept.createdAt),
    member_count: count,
  };
}

var IconEye = function() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
};
var IconEdit = function() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
};
var IconClose = function() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
};

function StatsRow(props) {
  var depts = props.departments;
  var totalMembers = depts.reduce(function(s, d) { return s + d.member_count; }, 0);
  var typeCount = new Set(depts.map(function(d) { return d.dept_type; }).filter(Boolean)).size;
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-icon stat-icon--indigo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <div><div className="stat-val">{depts.length}</div><div className="stat-label">Total Departments</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon--emerald">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div><div className="stat-val">{totalMembers}</div><div className="stat-label">Total Members</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-icon stat-icon--amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <div><div className="stat-val">{typeCount}</div><div className="stat-label">Dept Types</div></div>
      </div>
    </div>
  );
}

function DeptCard(props) {
  var dept = props.dept;
  var badgeCls = TYPE_BADGE[dept.dept_type] || "badge--default";
  return (
    <div className="dept-card">
      <div className="dept-card-header">
        <div className="dept-icon">{dept.dept_name ? dept.dept_name[0].toUpperCase() : "D"}</div>
        <div className="dept-card-actions">
          <button className="btn-icon" title="View detail" onClick={function() { props.onView(dept); }}><IconEye/></button>
          <button className="btn-icon btn-icon--edit" title="Edit" onClick={function() { props.onEdit(dept); }}><IconEdit/></button>
        </div>
      </div>
      <div className="dept-card-body">
        <div className="dept-name">{dept.dept_name}</div>
        <span className={"badge " + badgeCls}>{dept.dept_type}</span>
        <div className="dept-meta">
          <span className="dept-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {dept.member_count} members
          </span>
          <span className="dept-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            created_at: {dept.created_at || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DeptFormModal(props) {
  var form = props.form;
  var setForm = props.setForm;
  var errors = props.errors;
  function handleChange(field) {
    return function(e) {
      var val = e.target.value;
      setForm(function(prev) { return Object.assign({}, prev, { [field]: val }); });
    };
  }
  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-header">
          <h2>{props.isEditing ? "Edit Department" : "Add New Department"}</h2>
          <button className="modal-close" onClick={props.onClose}><IconClose/></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">dept_name <span>*</span></label>
            <input className="form-control" placeholder="e.g. Engineering, Marketing..." value={form.dept_name} onChange={handleChange("dept_name")}/>
            {errors.dept_name && <div className="form-error">{errors.dept_name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">dept_type <span>*</span></label>
            <select className="form-control" value={form.dept_type} onChange={handleChange("dept_type")}>
              <option value="">-- Select type --</option>
              {DEPT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
            </select>
            {errors.dept_type && <div className="form-error">{errors.dept_type}</div>}
          </div>
          {errors.submit && <div className="form-error">{errors.submit}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={props.onClose} disabled={props.saving}>Cancel</button>
          <button className="btn btn-primary" onClick={props.onSave} disabled={props.saving}>{props.saving ? "Saving..." : props.isEditing ? "Save Changes" : "Create Department"}</button>
        </div>
      </div>
    </div>
  );
}

function DeptDetailModal(props) {
  var dept = props.dept;
  var badgeCls = TYPE_BADGE[dept.dept_type] || "badge--default";
  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-header"><h2>Department Detail</h2><button className="modal-close" onClick={props.onClose}><IconClose/></button></div>
        <div className="modal-body">
          <div className="dept-detail-hero">
            <div className="dept-detail-icon">{dept.dept_name ? dept.dept_name[0].toUpperCase() : "D"}</div>
            <div className="dept-detail-name">{dept.dept_name}</div>
            <span className={"badge " + badgeCls}>{dept.dept_type}</span>
          </div>
          <div className="detail-grid" style={{ marginTop: 16 }}>
            <div className="detail-field"><span className="detail-key">dept_id</span><span className="detail-val">#{dept.dept_id}</span></div>
            <div className="detail-field"><span className="detail-key">dept_type</span><span className="detail-val">{dept.dept_type}</span></div>
            <div className="detail-field"><span className="detail-key">members</span><span className="detail-val">{dept.member_count}</span></div>
            <div className="detail-field"><span className="detail-key">created_at</span><span className="detail-val">{dept.created_at || "-"}</span></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
          <button className="btn btn-primary" onClick={function() { props.onClose(); props.onEdit(dept); }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

var DepartmentManagement = function() {
  var deptsState = useState([]);
  var departments = deptsState[0];
  var setDepartments = deptsState[1];

  var searchState = useState("");
  var search = searchState[0];
  var setSearch = searchState[1];

  var filterState = useState("");
  var filterType = filterState[0];
  var setFilterType = filterState[1];

  var modalState = useState(null); // "add"|"edit"|"detail"
  var modalMode = modalState[0];
  var setModalMode = modalState[1];

  var selState = useState(null);
  var selected = selState[0];
  var setSelected = selState[1];

  var formState = useState(EMPTY_FORM);
  var form = formState[0];
  var setForm = formState[1];

  var errState = useState({});
  var errors = errState[0];
  var setErrors = errState[1];

  var loadingState = useState(true);
  var isLoading = loadingState[0];
  var setIsLoading = loadingState[1];

  var savingState = useState(false);
  var isSaving = savingState[0];
  var setIsSaving = savingState[1];

  var pageErrorState = useState("");
  var pageError = pageErrorState[0];
  var setPageError = pageErrorState[1];

  async function fetchDepartmentsData() {
    setIsLoading(true);
    setPageError("");
    try {
      var deptResponse = await getDepartments();
      var memberCountMap = {};
      try {
        var users = await getUsers();
        if (Array.isArray(users)) {
          users.forEach(function(user) {
            if (user && user.deptId != null) {
              memberCountMap[user.deptId] = (memberCountMap[user.deptId] || 0) + 1;
            }
          });
        }
      } catch (memberError) {
        memberCountMap = {};
      }
      var normalized = Array.isArray(deptResponse) ? deptResponse.map(function(dept) {
        return normalizeDepartment(dept, memberCountMap);
      }) : [];
      setDepartments(normalized);
    } catch (error) {
      setPageError(error && error.response && error.response.data && error.response.data.message ? error.response.data.message : "Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(function() {
    fetchDepartmentsData();
  }, []);

  var filtered = useMemo(function() {
    var q = search.toLowerCase();
    return departments.filter(function(d) {
      var name = (d.dept_name || "").toLowerCase();
      var type = (d.dept_type || "").toLowerCase();
      var ms = name.includes(q) || type.includes(q);
      var mt = filterType ? d.dept_type === filterType : true;
      return ms && mt;
    });
  }, [departments, search, filterType]);

  function validate() {
    var errs = {};
    if (!form.dept_name.trim()) errs.dept_name = "dept_name is required";
    if (!form.dept_type) errs.dept_type = "Please select a dept_type";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setSelected(null); setModalMode("add"); }
  function openEdit(d) { setSelected(d); setForm({ dept_name: d.dept_name, dept_type: d.dept_type }); setErrors({}); setModalMode("edit"); }
  function openDetail(d) { setSelected(d); setModalMode("detail"); }
  function closeModal() { setModalMode(null); setErrors({}); }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);
    setErrors({});
    try {
      var payload = {
        deptName: form.dept_name.trim(),
        deptType: form.dept_type,
      };
      if (modalMode === "edit" && selected) {
        var updated = await updateDepartment(selected.dept_id, payload);
        var normalizedUpdated = normalizeDepartment(updated, {});
        setDepartments(function(prev) {
          return prev.map(function(d) {
            return d.dept_id === selected.dept_id ? Object.assign({}, normalizedUpdated, { member_count: d.member_count }) : d;
          });
        });
        setSelected(function(prev) {
          if (!prev || prev.dept_id !== selected.dept_id) return prev;
          return Object.assign({}, normalizedUpdated, { member_count: prev.member_count });
        });
      } else {
        var created = await createDepartment(payload);
        var normalizedCreated = normalizeDepartment(created, {});
        setDepartments(function(prev) {
          return [normalizedCreated].concat(prev);
        });
      }
      closeModal();
    } catch (error) {
      setErrors({
        submit: error && error.response && error.response.data && error.response.data.message ? error.response.data.message : "Failed to save department.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dept-mgmt">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Department Management</h1>
          <p>View, add and update departments in the organisation</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Department
        </button>
      </div>

      <StatsRow departments={departments}/>

      <div className="admin-card">
        <div className="card-header">
          <span className="card-title">Department List ({filtered.length})</span>
          <div className="filter-bar">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="search-input" placeholder="Search departments..." value={search} onChange={function(e) { setSearch(e.target.value); }}/>
            </div>
            <select className="filter-select" value={filterType} onChange={function(e) { setFilterType(e.target.value); }}>
              <option value="">All Types</option>
              {DEPT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
            </select>
          </div>
        </div>

        {pageError && (
          <div className="empty-state">
            <h3>Unable to load departments</h3>
            <p>{pageError}</p>
            <button className="btn btn-secondary" onClick={fetchDepartmentsData}>Retry</button>
          </div>
        )}

        {!pageError && isLoading ? (
          <div className="empty-state">
            <h3>Loading departments...</h3>
            <p>Please wait while we fetch the latest department data.</p>
          </div>
        ) : !pageError && filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No departments found</h3><p>Try adjusting your filters</p>
          </div>
        ) : !pageError ? (
          <div className="dept-grid">
            {filtered.map(function(dept) {
              return <DeptCard key={dept.dept_id} dept={dept} onView={openDetail} onEdit={openEdit}/>;
            })}
          </div>
        ) : null}
      </div>

      {(modalMode === "add" || modalMode === "edit") && (
        <DeptFormModal isEditing={modalMode === "edit"} form={form} setForm={setForm} errors={errors} saving={isSaving} onSave={handleSave} onClose={closeModal}/>
      )}
      {modalMode === "detail" && selected && (
        <DeptDetailModal dept={selected} onClose={closeModal} onEdit={openEdit}/>
      )}
    </div>
  );
};

export default DepartmentManagement;