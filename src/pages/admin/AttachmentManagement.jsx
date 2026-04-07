import { useState, useMemo, useEffect } from "react";
import "../../styles/admin.shared.css";
import "../../styles/AttachmentManagement.css";
import { getAllIdeas } from "../../services/ideaService";
import {
  getDocumentsByIdea,
  deleteDocument,
} from "../../services/documentService";
import { getDepartments } from "../../services/departmentService";

// ── Schema: document { doc_id, idea_id, file_name, file_path,
//                      file_type, file_size_kb, uploaded_at }
// NOTE: Backend does not expose a /documents (list-all) endpoint.
//       This page fetches all ideas first, then fetches documents per idea in parallel.
//       For better performance, consider adding GET /documents or GET /reports/attachments
//       to the backend.

var FILE_STYLE = {
  pdf:  { label: "PDF",  color: "#ef4444", bg: "#fef2f2" },
  docx: { label: "DOC",  color: "#3b82f6", bg: "#eff6ff" },
  doc:  { label: "DOC",  color: "#3b82f6", bg: "#eff6ff" },
  xlsx: { label: "XLS",  color: "#10b981", bg: "#f0fdf4" },
  xls:  { label: "XLS",  color: "#10b981", bg: "#f0fdf4" },
  pptx: { label: "PPT",  color: "#f59e0b", bg: "#fffbeb" },
  jpg:  { label: "IMG",  color: "#8b5cf6", bg: "#f5f3ff" },
  jpeg: { label: "IMG",  color: "#8b5cf6", bg: "#f5f3ff" },
  png:  { label: "IMG",  color: "#8b5cf6", bg: "#f5f3ff" },
  zip:  { label: "ZIP",  color: "#64748b", bg: "#f1f5f9" },
  txt:  { label: "TXT",  color: "#6b7280", bg: "#f9fafb" },
};

function getExt(file_name) {
  return (file_name || "").split(".").pop().toLowerCase();
}

function fmtSize(file_size_kb) {
  if (!file_size_kb) return "0 KB";
  if (file_size_kb < 1024) return Number(file_size_kb).toFixed(1) + " KB";
  return (file_size_kb / 1024).toFixed(1) + " MB";
}

// Normalize document from camelCase API → snake_case UI
function normalizeDoc(doc, idea, deptList) {
  var dept =
    deptList.find(function (d) {
      return (
        String(d.dept_id) === String(idea?.deptId ?? idea?.dept_id ?? "")
      );
    }) || {};
  return {
    doc_id: doc.docId ?? doc.doc_id,
    idea_id: doc.ideaId ?? doc.idea_id ?? idea?.ideaId ?? idea?.idea_id,
    file_name: doc.fileName ?? doc.file_name ?? "",
    file_path: doc.filePath ?? doc.file_path ?? "",
    file_type: doc.fileType ?? doc.file_type ?? "",
    file_size_kb: doc.fileSizeKb ?? doc.file_size_kb ?? 0,
    uploaded_at: doc.uploadedAt
      ? String(doc.uploadedAt).split("T")[0]
      : doc.uploaded_at ?? "",
    // Enriched from idea
    idea_title: idea?.title ?? idea?.idea_title ?? "(untitled)",
    uploader_name: idea?.authorName ?? idea?.author_name ?? "Anonymous",
    dept_id: idea?.deptId ?? idea?.dept_id ?? "",
    dept_name: dept.dept_name ?? "",
  };
}

var PAGE_SIZE = 6;

var IconTrash = function () {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

var AttachmentManagement = function () {
  var docsState = useState([]);
  var documents = docsState[0];
  var setDocuments = docsState[1];

  var deptsState = useState([]);
  var departments = deptsState[0];
  var setDepartments = deptsState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var pageErrorState = useState("");
  var pageError = pageErrorState[0];
  var setPageError = pageErrorState[1];

  var searchState = useState("");
  var search = searchState[0];
  var setSearch = searchState[1];

  var deptState = useState("");
  var filterDept = deptState[0];
  var setFilterDept = deptState[1];

  var pageState = useState(1);
  var currentPage = pageState[0];
  var setCurrentPage = pageState[1];

  var confirmState = useState(null);
  var toDelete = confirmState[0];
  var setToDelete = confirmState[1];

  var bulkState = useState(false);
  var showBulk = bulkState[0];
  var setShowBulk = bulkState[1];

  var selState = useState(new Set());
  var selected = selState[0];
  var setSelected = selState[1];

  var deletingState = useState(false);
  var deleting = deletingState[0];
  var setDeleting = deletingState[1];

  var deleteErrState = useState("");
  var deleteError = deleteErrState[0];
  var setDeleteError = deleteErrState[1];

  useEffect(function () {
    loadDocuments();
  }, []);

  // Load all ideas → parallel-fetch docs per idea → flatten
  async function loadDocuments() {
    setLoading(true);
    setPageError("");
    try {
      // Step 1: fetch departments for enrichment
      var deptResponse = await getDepartments().catch(function () {
        return [];
      });
      var normalizedDepts = (Array.isArray(deptResponse) ? deptResponse : []).map(
        function (d) {
          return {
            dept_id: d.deptId ?? d.dept_id,
            dept_name: d.deptName ?? d.dept_name ?? "",
          };
        }
      );
      setDepartments(normalizedDepts);

      // Step 2: fetch all ideas (large page to minimize pagination)
      var ideasResponse = await getAllIdeas({ page: 0, size: 1000 });
      var ideas = Array.isArray(ideasResponse)
        ? ideasResponse
        : ideasResponse?.content ?? ideasResponse?.data ?? [];

      if (ideas.length === 0) {
        setDocuments([]);
        return;
      }

      // Step 3: parallel-fetch documents for each idea
      var results = await Promise.allSettled(
        ideas.map(function (idea) {
          var ideaId = idea.ideaId ?? idea.idea_id;
          return getDocumentsByIdea(ideaId).then(function (docs) {
            var docList = Array.isArray(docs) ? docs : docs?.content ?? [];
            return docList.map(function (doc) {
              return normalizeDoc(doc, idea, normalizedDepts);
            });
          });
        })
      );

      // Step 4: flatten successful results
      var allDocs = [];
      results.forEach(function (result) {
        if (result.status === "fulfilled") {
          allDocs = allDocs.concat(result.value);
        }
      });
      setDocuments(allDocs);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load attachments."
      );
    } finally {
      setLoading(false);
    }
  }

  var filtered = useMemo(
    function () {
      var q = search.toLowerCase();
      return documents.filter(function (d) {
        var ms =
          (d.file_name || "").toLowerCase().includes(q) ||
          (d.uploader_name || "").toLowerCase().includes(q) ||
          (d.idea_title || "").toLowerCase().includes(q);
        var md = filterDept
          ? String(d.dept_id) === filterDept
          : true;
        return ms && md;
      });
    },
    [documents, search, filterDept]
  );

  var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  var paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  var totalSizeKb = documents.reduce(function (s, d) {
    return s + (d.file_size_kb || 0);
  }, 0);

  function toggleSelect(id) {
    setSelected(function (prev) {
      var next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    var allIds = paginated.map(function (d) {
      return d.doc_id;
    });
    var allSelectedNow = allIds.every(function (id) {
      return selected.has(id);
    });
    if (allSelectedNow) {
      setSelected(function (prev) {
        var next = new Set(prev);
        allIds.forEach(function (id) {
          next.delete(id);
        });
        return next;
      });
    } else {
      setSelected(function (prev) {
        var next = new Set(prev);
        allIds.forEach(function (id) {
          next.add(id);
        });
        return next;
      });
    }
  }

  // DELETE /api/ideas/:ideaId/documents/:docId
  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteDocument(toDelete.idea_id, toDelete.doc_id);
      setDocuments(function (prev) {
        return prev.filter(function (d) {
          return d.doc_id !== toDelete.doc_id;
        });
      });
      setSelected(function (prev) {
        var n = new Set(prev);
        n.delete(toDelete.doc_id);
        return n;
      });
      setToDelete(null);
    } catch (error) {
      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete document."
      );
    } finally {
      setDeleting(false);
    }
  }

  // Bulk DELETE — calls deleteDocument for each selected doc in parallel
  async function handleBulkDelete() {
    setDeleting(true);
    setDeleteError("");
    var docsToDelete = documents.filter(function (d) {
      return selected.has(d.doc_id);
    });
    try {
      await Promise.all(
        docsToDelete.map(function (doc) {
          return deleteDocument(doc.idea_id, doc.doc_id);
        })
      );
      var deletedIds = new Set(docsToDelete.map(function (d) { return d.doc_id; }));
      setDocuments(function (prev) {
        return prev.filter(function (d) {
          return !deletedIds.has(d.doc_id);
        });
      });
      setSelected(new Set());
      setShowBulk(false);
    } catch (error) {
      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Some files could not be deleted."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="attach-mgmt">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Attachment Management</h1>
            <p>View and delete attached documents across the entire system</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="card-body">Loading attachments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="attach-mgmt">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attachment Management</h1>
          <p>View and delete attached documents across the entire system</p>
        </div>
      </div>

      {pageError && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ color: "#dc2626" }}>
            {pageError}
            <button
              className="btn btn-sm btn-secondary"
              style={{ marginLeft: 12 }}
              onClick={loadDocuments}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--indigo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{documents.length}</div>
            <div className="stat-label">Total Documents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--sky">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{fmtSize(totalSizeKb)}</div>
            <div className="stat-label">Total Size (file_size_kb)</div>
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
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{departments.length}</div>
            <div className="stat-label">Departments</div>
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
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </div>
          <div>
            <div className="stat-val">{selected.size}</div>
            <div className="stat-label">Selected</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <span className="card-title">
            Document List ({filtered.length})
          </span>
          <div className="filter-bar">
            {selected.size > 0 && (
              <button
                className="btn btn-danger btn-sm"
                onClick={function () {
                  setDeleteError("");
                  setShowBulk(true);
                }}
              >
                <IconTrash />
                Delete {selected.size} files
              </button>
            )}
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
                placeholder="Search file_name, uploader, idea..."
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
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={
                      paginated.length > 0 &&
                      paginated.every(function (d) {
                        return selected.has(d.doc_id);
                      })
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th>file_name</th>
                <th>idea (idea_id)</th>
                <th>Uploaded by</th>
                <th>Department</th>
                <th>uploaded_at</th>
                <th>file_size_kb</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <h3>No documents found</h3>
                      <p>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(function (doc) {
                  var ext = getExt(doc.file_name);
                  var fs =
                    FILE_STYLE[ext] || {
                      label: "FILE",
                      color: "#64748b",
                      bg: "#f1f5f9",
                    };
                  return (
                    <tr
                      key={doc.doc_id}
                      className={
                        selected.has(doc.doc_id) ? "row-selected" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={selected.has(doc.doc_id)}
                          onChange={function () {
                            toggleSelect(doc.doc_id);
                          }}
                        />
                      </td>
                      <td>
                        <div className="file-cell">
                          <div
                            className="file-icon"
                            style={{ background: fs.bg, color: fs.color }}
                          >
                            <span style={{ fontSize: 9, fontWeight: 700 }}>
                              {fs.label}
                            </span>
                          </div>
                          <div>
                            <div className="file-name">{doc.file_name}</div>
                            <div className="file-ext">
                              file_type: {doc.file_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          className="idea-title-cell"
                          title={doc.idea_title}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                            }}
                          >
                            #{doc.idea_id}
                          </span>{" "}
                          {doc.idea_title.length > 30
                            ? doc.idea_title.substring(0, 30) + "..."
                            : doc.idea_title}
                        </div>
                      </td>
                      <td>
                        <div className="table-avatar">
                          <div
                            className="table-avatar-icon"
                            style={{ width: 26, height: 26, fontSize: 11 }}
                          >
                            {(doc.uploader_name || "?")[0]}
                          </div>
                          <span style={{ fontSize: 13 }}>
                            {doc.uploader_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--default">
                          {doc.dept_name || doc.dept_id || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {doc.uploaded_at}
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {fmtSize(doc.file_size_kb)}
                      </td>
                      <td>
                        <button
                          className="btn-icon btn-icon--delete"
                          title="Delete document"
                          onClick={function () {
                            setDeleteError("");
                            setToDelete(doc);
                          }}
                        >
                          <IconTrash />
                        </button>
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
              {filtered.length} documents
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

      {/* SINGLE DELETE */}
      {toDelete && (
        <div
          className="modal-overlay"
          onClick={function () {
            if (!deleting) setToDelete(null);
          }}
        >
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="confirm-body">
              <div className="confirm-icon">
                <IconTrash />
              </div>
              <h3>Delete document?</h3>
              <p>
                doc_id <strong>#{toDelete.doc_id}</strong> —{" "}
                <strong>{toDelete.file_name}</strong> will be permanently
                removed from the system. This cannot be undone.
              </p>
              {deleteError && (
                <div className="form-error" style={{ marginTop: 8 }}>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={function () {
                  setToDelete(null);
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE */}
      {showBulk && (
        <div
          className="modal-overlay"
          onClick={function () {
            if (!deleting) setShowBulk(false);
          }}
        >
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <div className="confirm-body">
              <div className="confirm-icon">
                <IconTrash />
              </div>
              <h3>Delete {selected.size} documents?</h3>
              <p>
                All <strong>{selected.size}</strong> selected documents will be
                permanently removed. This cannot be undone.
              </p>
              {deleteError && (
                <div className="form-error" style={{ marginTop: 8 }}>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={function () {
                  setShowBulk(false);
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentManagement;