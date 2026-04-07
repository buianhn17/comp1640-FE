import { useState, useMemo, useEffect } from "react";
import "../../styles/admin.shared.css";
import "../../styles/UserManagement.css";
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserActive,
} from "../../services/userService";
import { getDepartments } from "../../services/departmentService";

// ── Schema: user { user_id, dept_id, role_id, full_name, email,
//                  password_hash, staff_type, is_active, created_at, updated_at }
// ── Schema: role { role_id, role_name, description }
// ── Schema: department { dept_id, dept_name, dept_type, created_at }

var ROLE_OPTIONS = [
  { role_id: 1, role_name: "STAFF" },
  { role_id: 2, role_name: "QA_MANAGER" },
  { role_id: 3, role_name: "QA_COORDINATOR" },
  { role_id: 4, role_name: "ADMIN" },
];

var ROLE_LABEL = {
  STAFF: "Staff",
  QA_MANAGER: "QA Manager",
  QA_COORDINATOR: "QA Coordinator",
  ADMIN: "Admin",
};

var ROLE_BADGE = {
  STAFF: "badge--staff",
  QA_MANAGER: "badge--manager",
  QA_COORDINATOR: "badge--coordinator",
  ADMIN: "badge--admin",
};

var STAFF_TYPES = ["Full-time", "Part-time", "Intern", "Contractor"];

var PAGE_SIZE = 5;

// POST /api/users body shape  (password_hash field = plain password, backend hashes it)
var EMPTY_FORM = {
  full_name: "",
  email: "",
  password_hash: "",
  role_name: "STAFF",
  staff_type: "Full-time",
  dept_id: "",
};

// Normalize camelCase API response → snake_case used by UI
function normalizeUser(u, deptList) {
  var dept =
    deptList.find(function (d) {
      return String(d.dept_id) === String(u.deptId ?? u.dept_id);
    }) || {};
  return {
    user_id: u.userId ?? u.user_id,
    dept_id: u.deptId ?? u.dept_id ?? "",
    full_name: u.fullName ?? u.full_name ?? "",
    email: u.email ?? "",
    role_name: u.roleName ?? u.role_name ?? "STAFF",
    staff_type: u.staffType ?? u.staff_type ?? "Full-time",
    is_active: u.isActive !== undefined ? u.isActive : u.is_active !== false,
    created_at: u.createdAt
      ? String(u.createdAt).split("T")[0]
      : u.created_at ?? "",
    dept_name: dept.dept_name ?? u.deptName ?? "",
  };
}

function normalizeDept(d) {
  return {
    dept_id: d.deptId ?? d.dept_id,
    dept_name: d.deptName ?? d.dept_name ?? "",
  };
}

var IconEdit = function () {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
};
var IconBan = function () {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
};
var IconEye = function () {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};
var IconClose = function () {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
};

function UserForm(props) {
  var form = props.form;
  var setForm = props.setForm;
  var errors = props.errors;
  var isEdit = props.isEdit;
  var departments = props.departments;

  function set(field) {
    return function (e) {
      var val = e.target.value;
      setForm(function (f) {
        return Object.assign({}, f, { [field]: val });
      });
    };
  }

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Full Name <span>*</span>
          </label>
          <input
            className="form-control"
            placeholder="Enter full name"
            value={form.full_name}
            onChange={set("full_name")}
          />
          {errors.full_name && (
            <div className="form-error">{errors.full_name}</div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">
            Email <span>*</span>
          </label>
          <input
            className="form-control"
            placeholder="email@company.com"
            value={form.email}
            onChange={set("email")}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          {isEdit
            ? "New Password (leave blank to keep current)"
            : "Password"}{" "}
          {!isEdit && <span>*</span>}
        </label>
        <input
          className="form-control"
          type="password"
          placeholder="••••••••"
          value={form.password_hash}
          onChange={set("password_hash")}
        />
        {errors.password_hash && (
          <div className="form-error">{errors.password_hash}</div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Role <span>*</span>
          </label>
          <select
            className="form-control"
            value={form.role_name}
            onChange={set("role_name")}
          >
            {ROLE_OPTIONS.map(function (r) {
              return (
                <option key={r.role_id} value={r.role_name}>
                  {ROLE_LABEL[r.role_name]}
                </option>
              );
            })}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            Staff Type <span>*</span>
          </label>
          <select
            className="form-control"
            value={form.staff_type}
            onChange={set("staff_type")}
          >
            {STAFF_TYPES.map(function (t) {
              return (
                <option key={t} value={t}>
                  {t}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Department <span>*</span>
        </label>
        <select
          className="form-control"
          value={form.dept_id}
          onChange={set("dept_id")}
        >
          <option value="">-- Select Department --</option>
          {departments.map(function (d) {
            return (
              <option key={d.dept_id} value={d.dept_id}>
                {d.dept_name}
              </option>
            );
          })}
        </select>
        {errors.dept_id && (
          <div className="form-error">{errors.dept_id}</div>
        )}
      </div>
    </div>
  );
}

var UserManagement = function () {
  var usersState = useState([]);
  var users = usersState[0];
  var setUsers = usersState[1];

  var deptsState = useState([]);
  var departments = deptsState[0];
  var setDepartments = deptsState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

  var submittingState = useState(false);
  var submitting = submittingState[0];
  var setSubmitting = submittingState[1];

  var searchState = useState("");
  var search = searchState[0];
  var setSearch = searchState[1];

  var deptState = useState("");
  var filterDept = deptState[0];
  var setFilterDept = deptState[1];

  var roleState = useState("");
  var filterRole = roleState[0];
  var setFilterRole = roleState[1];

  var pageState = useState(1);
  var currentPage = pageState[0];
  var setCurrentPage = pageState[1];

  var modalState = useState(null); // "add"|"edit"|"detail"|"disable"
  var modalMode = modalState[0];
  var setModalMode = modalState[1];

  var selState = useState(null);
  var selectedUser = selState[0];
  var setSelectedUser = selState[1];

  var formState = useState(EMPTY_FORM);
  var form = formState[0];
  var setForm = formState[1];

  var errState = useState({});
  var formErrors = errState[0];
  var setFormErrors = errState[1];

  var submitErrState = useState("");
  var submitError = submitErrState[0];
  var setSubmitError = submitErrState[1];

  // GET /api/users  +  GET /api/departments
  useEffect(function () {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      var results = await Promise.all([
        getUsers(),
        getDepartments().catch(function () {
          return [];
        }),
      ]);
      var rawUsers = Array.isArray(results[0]) ? results[0] : [];
      var rawDepts = Array.isArray(results[1]) ? results[1] : [];
      var normalizedDepts = rawDepts.map(normalizeDept);
      setDepartments(normalizedDepts);
      setUsers(
        rawUsers.map(function (u) {
          return normalizeUser(u, normalizedDepts);
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  var filtered = useMemo(
    function () {
      return users.filter(function (u) {
        var q = search.toLowerCase();
        var ms =
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q);
        var md = filterDept
          ? String(u.dept_id) === filterDept
          : true;
        var mr = filterRole ? u.role_name === filterRole : true;
        return ms && md && mr;
      });
    },
    [users, search, filterDept, filterRole]
  );

  var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  var paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function validate(isEdit) {
    var errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Invalid email address";
    if (!isEdit && !form.password_hash.trim())
      errs.password_hash = "Password is required";
    else if (!isEdit && form.password_hash.length < 6)
      errs.password_hash = "Minimum 6 characters";
    if (!form.dept_id) errs.dept_id = "Please select a department";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function getDeptName(dept_id) {
    var found = departments.find(function (d) {
      return String(d.dept_id) === String(dept_id);
    });
    return found ? found.dept_name : "";
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError("");
    setModalMode("add");
  }
  function openEdit(u) {
    setSelectedUser(u);
    setForm(Object.assign({}, u, { password_hash: "" }));
    setFormErrors({});
    setSubmitError("");
    setModalMode("edit");
  }
  function openDetail(u) {
    setSelectedUser(u);
    setModalMode("detail");
  }
  function openDisable(u) {
    setSelectedUser(u);
    setSubmitError("");
    setModalMode("disable");
  }
  function closeModal() {
    setModalMode(null);
    setSubmitError("");
  }

  // POST /api/users
  async function handleAdd() {
    if (!validate(false)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      var payload = {
        fullName: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password_hash,   // backend receives plain password, hashes it
        roleName: form.role_name,
        staffType: form.staff_type,
        deptId: Number(form.dept_id),
      };
      var created = await createUser(payload);
      var normalized = normalizeUser(created, departments);
      setUsers(function (prev) {
        return [normalized].concat(prev);
      });
      closeModal();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create user."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // PUT /api/users/:id
  async function handleEdit() {
    if (!validate(true)) return;
    if (!selectedUser) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      var payload = {
        fullName: form.full_name.trim(),
        email: form.email.trim(),
        roleName: form.role_name,
        staffType: form.staff_type,
        deptId: Number(form.dept_id),
      };
      if (form.password_hash.trim()) {
        payload.password = form.password_hash;
      }
      var updated = await updateUser(selectedUser.user_id, payload);
      var normalized = normalizeUser(updated, departments);
      setUsers(function (prev) {
        return prev.map(function (u) {
          return u.user_id === selectedUser.user_id ? normalized : u;
        });
      });
      closeModal();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update user."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // PATCH /api/users/:id/toggle-active — no body, toggles is_active
  async function handleDisable() {
    if (!selectedUser) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await toggleUserActive(selectedUser.user_id);
      setUsers(function (prev) {
        return prev.map(function (u) {
          return u.user_id === selectedUser.user_id
            ? Object.assign({}, u, { is_active: !u.is_active })
            : u;
        });
      });
      closeModal();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to toggle user status."
      );
    } finally {
      setSubmitting(false);
    }
  }

  var stats = {
    total: users.length,
    active: users.filter(function (u) {
      return u.is_active;
    }).length,
    inactive: users.filter(function (u) {
      return !u.is_active;
    }).length,
    admins: users.filter(function (u) {
      return u.role_name === "ADMIN";
    }).length,
  };

  if (loading) {
    return (
      <div className="user-mgmt">
        <div className="empty-state">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-mgmt">
        <div className="empty-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-mgmt">
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>View, create, update and disable system user accounts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Account
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--indigo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{stats.total}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--emerald">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--rose">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{stats.inactive}</div>
            <div className="stat-label">Disabled</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--amber">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{stats.admins}</div>
            <div className="stat-label">Administrators</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <span className="card-title">Account List ({filtered.length})</span>
          <div className="filter-bar">
            <div className="search-box">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                placeholder="Search name or email..."
                value={search}
                onChange={function (e) {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="filter-select"
              value={filterDept}
              onChange={function (e) {
                setFilterDept(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Departments</option>
              {departments.map(function (d) {
                return (
                  <option key={d.dept_id} value={String(d.dept_id)}>
                    {d.dept_name}
                  </option>
                );
              })}
            </select>
            <select
              className="filter-select"
              value={filterRole}
              onChange={function (e) {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map(function (r) {
                return (
                  <option key={r.role_id} value={r.role_name}>
                    {ROLE_LABEL[r.role_name]}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Staff Type</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <h3>No accounts found</h3>
                      <p>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(function (user) {
                  return (
                    <tr key={user.user_id}>
                      <td>
                        <div className="table-avatar">
                          <div className="table-avatar-icon">
                            {(user.full_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="table-avatar-name">
                              {user.full_name}
                            </div>
                            <div className="table-avatar-email">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (ROLE_BADGE[user.role_name] || "badge--default")
                          }
                        >
                          {ROLE_LABEL[user.role_name] || user.role_name}
                        </span>
                      </td>
                      <td>{user.staff_type}</td>
                      <td>{user.dept_name}</td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (user.is_active
                              ? "badge--active"
                              : "badge--inactive")
                          }
                        >
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {user.created_at}
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn-icon"
                            title="View detail"
                            onClick={function () {
                              openDetail(user);
                            }}
                          >
                            <IconEye />
                          </button>
                          <button
                            className="btn-icon btn-icon--edit"
                            title="Edit"
                            onClick={function () {
                              openEdit(user);
                            }}
                          >
                            <IconEdit />
                          </button>
                          <button
                            className={
                              "btn-icon " +
                              (user.is_active
                                ? "btn-icon--delete"
                                : "btn-icon--edit")
                            }
                            title={
                              user.is_active
                                ? "Disable account"
                                : "Enable account"
                            }
                            onClick={function () {
                              openDisable(user);
                            }}
                          >
                            <IconBan />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} accounts
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={function () {
                  setCurrentPage(1);
                }}
                disabled={currentPage === 1}
              >
                «
              </button>
              <button
                className="page-btn"
                onClick={function () {
                  setCurrentPage(function (p) {
                    return p - 1;
                  });
                }}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, function (_, i) {
                return i + 1;
              }).map(function (p) {
                return (
                  <button
                    key={p}
                    className={
                      "page-btn " + (p === currentPage ? "active" : "")
                    }
                    onClick={function () {
                      setCurrentPage(p);
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="page-btn"
                onClick={function () {
                  setCurrentPage(function (p) {
                    return p + 1;
                  });
                }}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                className="page-btn"
                onClick={function () {
                  setCurrentPage(totalPages);
                }}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {modalMode === "add" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h2>Add New Account</h2>
              <button className="modal-close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <UserForm
                form={form}
                setForm={setForm}
                errors={formErrors}
                isEdit={false}
                departments={departments}
              />
              {submitError && (
                <div className="form-error" style={{ marginTop: 10 }}>
                  {submitError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalMode === "edit" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h2>Edit Account</h2>
              <button className="modal-close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <UserForm
                form={form}
                setForm={setForm}
                errors={formErrors}
                isEdit={true}
                departments={departments}
              />
              {submitError && (
                <div className="form-error" style={{ marginTop: 10 }}>
                  {submitError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEdit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modalMode === "detail" && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h2>Account Detail</h2>
              <button className="modal-close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-avatar-block">
                <div className="detail-avatar">
                  {(selectedUser.full_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="detail-name">{selectedUser.full_name}</div>
                  <div className="detail-email">{selectedUser.email}</div>
                  <span
                    className={
                      "badge " +
                      (selectedUser.is_active
                        ? "badge--active"
                        : "badge--inactive")
                    }
                  >
                    {selectedUser.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
              <div className="detail-grid">
                <div className="detail-field">
                  <span className="detail-key">user_id</span>
                  <span className="detail-val">#{selectedUser.user_id}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-key">role</span>
                  <span className="detail-val">
                    {ROLE_LABEL[selectedUser.role_name] ||
                      selectedUser.role_name}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-key">staff_type</span>
                  <span className="detail-val">{selectedUser.staff_type}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-key">dept_id</span>
                  <span className="detail-val">
                    {selectedUser.dept_name} (#{selectedUser.dept_id})
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-key">created_at</span>
                  <span className="detail-val">{selectedUser.created_at}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-key">is_active</span>
                  <span className="detail-val">
                    {String(selectedUser.is_active)}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={function () {
                  closeModal();
                  openEdit(selectedUser);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE ACTIVE MODAL — PATCH /api/users/:id/toggle-active */}
      {modalMode === "disable" && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            style={{ maxWidth: 400 }}
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="confirm-body">
              <div className="confirm-icon">
                <IconBan />
              </div>
              <h3>
                {selectedUser.is_active
                  ? "Disable Account?"
                  : "Enable Account?"}
              </h3>
              <p>
                <strong>{selectedUser.full_name}</strong>{" "}
                {selectedUser.is_active
                  ? "will no longer be able to log in. All idea history and comments are preserved"
                  : "will be re-activated and can log in again"}{" "}
                (<code>is_active = {String(!selectedUser.is_active)}</code>).
              </p>
              {submitError && (
                <div className="form-error" style={{ marginTop: 8 }}>
                  {submitError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={
                  "btn " +
                  (selectedUser.is_active ? "btn-danger" : "btn-primary")
                }
                onClick={handleDisable}
                disabled={submitting}
              >
                {submitting
                  ? "Processing..."
                  : selectedUser.is_active
                  ? "Disable"
                  : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;