import { useState, useMemo, useEffect } from "react";
import "../../styles/admin.shared.css";
import "../../styles/AdminDashboard.css";
import { getStatisticsReport } from "../../services/reportService";
import { getAcademicYears } from "../../services/academicYearService";
import { getDepartments } from "../../services/departmentService";

// ── GET /reports/statistics?yearId=&deptId=
// ── GET /academic-years
// ── GET /departments

// Normalize API statistics response (camelCase) → shape used by UI
function normalizeReport(raw) {
  if (!raw) return null;
  return {
    total_ideas: raw.totalIdeas ?? 0,
    total_comments: raw.totalComments ?? 0,
    total_users: raw.totalUsers ?? 0,
    total_departments: raw.totalDepartments ?? 0,
    ideas_this_year: raw.ideasThisYear ?? raw.totalIdeas ?? 0,
    anonymous_ideas: raw.anonymousIdeas ?? 0,
    ideas_with_comments: raw.ideasWithComments ?? 0,
    ideas_without_comments: raw.ideasWithoutComments ?? 0,
    dept_name: raw.deptName ?? raw.dept_name ?? "",
    top_contributors: (raw.topContributors ?? []).map(function (c) {
      return {
        full_name: c.fullName ?? c.full_name ?? "",
        dept_name: c.deptName ?? c.dept_name ?? "",
        idea_count: c.ideaCount ?? c.idea_count ?? 0,
        initial: (c.fullName ?? c.full_name ?? "?")[0].toUpperCase(),
      };
    }),
    by_department: (raw.byDepartment ?? raw.departmentBreakdown ?? []).map(
      function (d) {
        return {
          dept_id: d.deptId ?? d.dept_id,
          dept_name: d.deptName ?? d.dept_name ?? "",
          idea_count: d.ideaCount ?? d.idea_count ?? 0,
          comment_count: d.commentCount ?? d.comment_count ?? 0,
          user_count: d.userCount ?? d.user_count ?? 0,
          percent: d.percent ?? 0,
        };
      }
    ),
    monthly_trend: (raw.monthlyTrend ?? raw.trendByMonth ?? []).map(
      function (m) {
        return {
          month: m.month ?? m.monthLabel ?? "",
          idea_count: m.ideaCount ?? m.idea_count ?? 0,
        };
      }
    ),
  };
}

function BarChart(props) {
  var data = props.data;
  var color = props.color || "#6366f1";
  var maxVal =
    Math.max.apply(
      null,
      data.map(function (d) {
        return d.idea_count;
      })
    ) || 1;
  return (
    <div className="mini-bar-chart">
      {data.map(function (d, i) {
        var pct = Math.max(Math.round((d.idea_count / maxVal) * 100), 4);
        return (
          <div key={i} className="mini-bar-col">
            <div className="mini-bar-tooltip">{d.idea_count} ideas</div>
            <div
              className="mini-bar"
              style={{ height: pct + "%", background: color }}
            />
            <div className="mini-bar-label">
              {(d.month || "").split(" ")[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart(props) {
  var w = props.ideas_with_comments;
  var wo = props.ideas_without_comments;
  var total = w + wo || 1;
  var pct = Math.round((w / total) * 100);
  var C = 2 * Math.PI * 36;
  var dash = (w / total) * C;
  return (
    <div className="donut-wrap">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle
          cx="45"
          cy="45"
          r="36"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="45"
          cy="45"
          r="36"
          fill="none"
          stroke="#6366f1"
          strokeWidth="10"
          strokeDasharray={dash + " " + (C - dash)}
          strokeDashoffset={C * 0.25}
          strokeLinecap="round"
        />
        <text
          x="45"
          y="49"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="#0f172a"
        >
          {pct}%
        </text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: "#6366f1" }} />
          <span>With comments: {w}</span>
        </div>
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: "#e2e8f0" }} />
          <span>Without: {wo}</span>
        </div>
      </div>
    </div>
  );
}

function HorizBar(props) {
  var rows = props.rows;
  var maxVal =
    Math.max.apply(
      null,
      rows.map(function (r) {
        return r.idea_count;
      })
    ) || 1;
  var colors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#f43f5e",
    "#0ea5e9",
  ];
  return (
    <div className="dept-bar-list">
      {rows.map(function (row, i) {
        var pct = Math.round((row.idea_count / maxVal) * 100);
        return (
          <div key={row.dept_id} className="dept-bar-row">
            <div className="dept-bar-name">{row.dept_name}</div>
            <div className="dept-bar-track">
              <div
                className="dept-bar-fill"
                style={{
                  width: pct + "%",
                  background: colors[i % colors.length],
                }}
              />
            </div>
            <div className="dept-bar-val">{row.idea_count}</div>
          </div>
        );
      })}
    </div>
  );
}

var EMPTY_DATA = {
  total_ideas: 0,
  total_comments: 0,
  total_users: 0,
  total_departments: 0,
  ideas_this_year: 0,
  anonymous_ideas: 0,
  ideas_with_comments: 0,
  ideas_without_comments: 0,
  dept_name: "",
  top_contributors: [],
  by_department: [],
  monthly_trend: [],
};

// ── MOCK DATA (dùng khi API chưa sẵn sàng) ──────────────────────────────────
var USE_MOCK = false; // đổi thành true để dùng mock, false để gọi API thật

var MOCK_ACADEMIC_YEARS = [
  { year_id: 1, year_label: "2023-2024" },
  { year_id: 2, year_label: "2024-2025" },
];

var MOCK_DEPARTMENTS = [
  { dept_id: 1, dept_name: "Engineering"  },
  { dept_id: 2, dept_name: "Marketing"    },
  { dept_id: 3, dept_name: "HR"           },
  { dept_id: 4, dept_name: "Finance"      },
  { dept_id: 5, dept_name: "Operations"   },
  { dept_id: 6, dept_name: "Design"       },
  { dept_id: 7, dept_name: "Data Science" },
];

var MOCK_REPORT_OVERALL = {
  total_ideas: 248, total_comments: 1042, total_users: 87, total_departments: 7,
  ideas_this_year: 112, anonymous_ideas: 34,
  ideas_with_comments: 89, ideas_without_comments: 159,
  dept_name: "",
  top_contributors: [
    { full_name: "Nguyen Van An",  dept_name: "Engineering", idea_count: 18, initial: "N" },
    { full_name: "Tran Thi Binh", dept_name: "Operations",  idea_count: 15, initial: "T" },
    { full_name: "Le Van Cuong",  dept_name: "Design",      idea_count: 13, initial: "L" },
    { full_name: "Vu Thi Huong",  dept_name: "Finance",     idea_count: 11, initial: "V" },
    { full_name: "Pham Quoc Bao", dept_name: "Marketing",   idea_count: 10, initial: "P" },
  ],
  by_department: [
    { dept_id: 1, dept_name: "Engineering",  idea_count: 62, comment_count: 284, user_count: 24, percent: 25 },
    { dept_id: 2, dept_name: "Marketing",    idea_count: 45, comment_count: 198, user_count: 12, percent: 18 },
    { dept_id: 5, dept_name: "Operations",   idea_count: 40, comment_count: 176, user_count: 18, percent: 16 },
    { dept_id: 4, dept_name: "Finance",      idea_count: 35, comment_count: 142, user_count: 10, percent: 14 },
    { dept_id: 3, dept_name: "HR",           idea_count: 28, comment_count: 110, user_count: 8,  percent: 11 },
    { dept_id: 6, dept_name: "Design",       idea_count: 24, comment_count: 96,  user_count: 7,  percent: 10 },
    { dept_id: 7, dept_name: "Data Science", idea_count: 14, comment_count: 36,  user_count: 9,  percent:  6 },
  ],
  monthly_trend: [
    { month: "Aug 24", idea_count: 12 }, { month: "Sep 24", idea_count: 18 },
    { month: "Oct 24", idea_count: 15 }, { month: "Nov 24", idea_count: 22 },
    { month: "Dec 24", idea_count: 10 }, { month: "Jan 25", idea_count: 28 },
    { month: "Feb 25", idea_count: 35 }, { month: "Mar 25", idea_count: 30 },
  ],
};

var MOCK_REPORT_BY_DEPT = {
  1: { dept_name: "Engineering",  total_ideas: 62,  total_comments: 284, total_users: 24, anonymous_ideas: 8,  ideas_with_comments: 41, ideas_without_comments: 21, top_contributors: [{ full_name: "Nguyen Van An",    idea_count: 18, initial: "N" }, { full_name: "Hoang Minh Duc", idea_count: 14, initial: "H" }], monthly_trend: [{ month: "Aug 24", idea_count: 4 }, { month: "Sep 24", idea_count: 6 }, { month: "Oct 24", idea_count: 5 }, { month: "Nov 24", idea_count: 9 }, { month: "Dec 24", idea_count: 3 }, { month: "Jan 25", idea_count: 11 }, { month: "Feb 25", idea_count: 14 }, { month: "Mar 25", idea_count: 10 }] },
  2: { dept_name: "Marketing",    total_ideas: 45,  total_comments: 198, total_users: 12, anonymous_ideas: 5,  ideas_with_comments: 30, ideas_without_comments: 15, top_contributors: [{ full_name: "Pham Quoc Bao",   idea_count: 10, initial: "P" }, { full_name: "Nguyen Thi Mai",  idea_count: 8,  initial: "N" }], monthly_trend: [{ month: "Aug 24", idea_count: 2 }, { month: "Sep 24", idea_count: 4 }, { month: "Oct 24", idea_count: 3 }, { month: "Nov 24", idea_count: 6 }, { month: "Dec 24", idea_count: 2 }, { month: "Jan 25", idea_count: 8 }, { month: "Feb 25", idea_count: 11 }, { month: "Mar 25", idea_count: 9 }] },
  3: { dept_name: "HR",           total_ideas: 28,  total_comments: 110, total_users: 8,  anonymous_ideas: 4,  ideas_with_comments: 18, ideas_without_comments: 10, top_contributors: [{ full_name: "Le Thi Hoa",      idea_count: 7,  initial: "L" }, { full_name: "Bui Van Nam",     idea_count: 5,  initial: "B" }], monthly_trend: [{ month: "Aug 24", idea_count: 1 }, { month: "Sep 24", idea_count: 2 }, { month: "Oct 24", idea_count: 2 }, { month: "Nov 24", idea_count: 4 }, { month: "Dec 24", idea_count: 1 }, { month: "Jan 25", idea_count: 5 }, { month: "Feb 25", idea_count: 7 }, { month: "Mar 25", idea_count: 6 }] },
  4: { dept_name: "Finance",      total_ideas: 35,  total_comments: 142, total_users: 10, anonymous_ideas: 6,  ideas_with_comments: 22, ideas_without_comments: 13, top_contributors: [{ full_name: "Vu Thi Huong",    idea_count: 11, initial: "V" }, { full_name: "Nguyen Duc Anh",  idea_count: 8,  initial: "N" }], monthly_trend: [{ month: "Aug 24", idea_count: 2 }, { month: "Sep 24", idea_count: 3 }, { month: "Oct 24", idea_count: 2 }, { month: "Nov 24", idea_count: 5 }, { month: "Dec 24", idea_count: 1 }, { month: "Jan 25", idea_count: 6 }, { month: "Feb 25", idea_count: 8 }, { month: "Mar 25", idea_count: 8 }] },
  5: { dept_name: "Operations",   total_ideas: 40,  total_comments: 176, total_users: 18, anonymous_ideas: 7,  ideas_with_comments: 28, ideas_without_comments: 12, top_contributors: [{ full_name: "Tran Thi Binh",  idea_count: 15, initial: "T" }, { full_name: "Le Van Cuong",    idea_count: 10, initial: "L" }], monthly_trend: [{ month: "Aug 24", idea_count: 2 }, { month: "Sep 24", idea_count: 4 }, { month: "Oct 24", idea_count: 3 }, { month: "Nov 24", idea_count: 6 }, { month: "Dec 24", idea_count: 2 }, { month: "Jan 25", idea_count: 7 }, { month: "Feb 25", idea_count: 9 }, { month: "Mar 25", idea_count: 7 }] },
  6: { dept_name: "Design",       total_ideas: 24,  total_comments: 96,  total_users: 7,  anonymous_ideas: 3,  ideas_with_comments: 15, ideas_without_comments: 9,  top_contributors: [{ full_name: "Le Van Cuong",    idea_count: 13, initial: "L" }, { full_name: "Bui Thi Ngoc",    idea_count: 7,  initial: "B" }], monthly_trend: [{ month: "Aug 24", idea_count: 1 }, { month: "Sep 24", idea_count: 2 }, { month: "Oct 24", idea_count: 1 }, { month: "Nov 24", idea_count: 3 }, { month: "Dec 24", idea_count: 1 }, { month: "Jan 25", idea_count: 4 }, { month: "Feb 25", idea_count: 6 }, { month: "Mar 25", idea_count: 6 }] },
  7: { dept_name: "Data Science", total_ideas: 14,  total_comments: 36,  total_users: 9,  anonymous_ideas: 1,  ideas_with_comments: 8,  ideas_without_comments: 6,  top_contributors: [{ full_name: "Nguyen Thanh Tu", idea_count: 5,  initial: "N" }, { full_name: "Do Thi Hien",     idea_count: 4,  initial: "D" }], monthly_trend: [{ month: "Aug 24", idea_count: 0 }, { month: "Sep 24", idea_count: 1 }, { month: "Oct 24", idea_count: 1 }, { month: "Nov 24", idea_count: 2 }, { month: "Dec 24", idea_count: 0 }, { month: "Jan 25", idea_count: 3 }, { month: "Feb 25", idea_count: 4 }, { month: "Mar 25", idea_count: 3 }] },
};

var AdminDashboard = function () {
  var yearsState = useState([]);
  var academicYears = yearsState[0];
  var setAcademicYears = yearsState[1];

  var deptsState = useState([]);
  var departments = deptsState[0];
  var setDepartments = deptsState[1];

  var yearFilterState = useState(""); // selected yearId string
  var filterYear = yearFilterState[0];
  var setFilterYear = yearFilterState[1];

  var deptFilterState = useState("overall"); // "overall" | dept_id string
  var filterDept = deptFilterState[0];
  var setFilterDept = deptFilterState[1];

  var dataState = useState(EMPTY_DATA);
  var data = dataState[0];
  var setData = dataState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var errorState = useState("");
  var error = errorState[0];
  var setError = errorState[1];

  // Load academic years + departments on mount, then load first report
  useEffect(function () {
    loadFilters();
  }, []);

  async function loadFilters() {
    setLoading(true);
    setError("");
    try {
      var rawYears, rawDepts;
      if (USE_MOCK) {
        await new Promise(function(r) { setTimeout(r, 300); });
        rawYears = MOCK_ACADEMIC_YEARS;
        rawDepts = MOCK_DEPARTMENTS;
      } else {
        var results = await Promise.all([
          getAcademicYears().catch(function () { return []; }),
          getDepartments().catch(function () { return []; }),
        ]);
        rawYears = Array.isArray(results[0]) ? results[0] : results[0]?.content ?? [];
        rawDepts = Array.isArray(results[1]) ? results[1] : [];
      }

      var normalizedYears = rawYears.map(function (y) {
        return {
          year_id: y.yearId ?? y.year_id,
          year_label: y.yearLabel ?? y.year_label ?? "",
        };
      });
      var normalizedDepts = rawDepts.map(function (d) {
        return {
          dept_id: d.deptId ?? d.dept_id,
          dept_name: d.deptName ?? d.dept_name ?? "",
        };
      });

      setAcademicYears(normalizedYears);
      setDepartments(normalizedDepts);

      // Default to first (most recent) academic year if available
      var defaultYearId =
        normalizedYears.length > 0
          ? String(normalizedYears[0].year_id)
          : "";
      setFilterYear(defaultYearId);

      await fetchReport(defaultYearId, "overall");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard data."
      );
      setLoading(false);
    }
  }

  async function fetchReport(yearId, deptFilter) {
    setLoading(true);
    setError("");
    try {
      var raw;
      if (USE_MOCK) {
        await new Promise(function(r) { setTimeout(r, 200); });
        if (deptFilter === "overall" || !deptFilter) {
          raw = MOCK_REPORT_OVERALL;
        } else {
          var mockDept = MOCK_REPORT_BY_DEPT[Number(deptFilter)];
          raw = mockDept ? {
            total_ideas: mockDept.total_ideas, total_comments: mockDept.total_comments,
            total_users: mockDept.total_users, anonymous_ideas: mockDept.anonymous_ideas,
            ideas_with_comments: mockDept.ideas_with_comments,
            ideas_without_comments: mockDept.ideas_without_comments,
            dept_name: mockDept.dept_name,
            top_contributors: mockDept.top_contributors,
            by_department: [], monthly_trend: mockDept.monthly_trend,
          } : MOCK_REPORT_OVERALL;
        }
        setData(raw);
      } else {
        var deptId = deptFilter !== "overall" && deptFilter ? Number(deptFilter) : null;
        raw = await getStatisticsReport(yearId || undefined, deptId);
        setData(normalizeReport(raw) || EMPTY_DATA);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load statistics.");
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch when filters change
  useEffect(
    function () {
      // Skip initial render before filters are loaded
      if (academicYears.length === 0 && departments.length === 0) return;
      fetchReport(filterYear, filterDept);
    },
    [filterYear, filterDept] // eslint-disable-line react-hooks/exhaustive-deps
  );

  var isOverall = filterDept === "overall";

  var colors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#8b5cf6",
    "#f43f5e",
    "#0ea5e9",
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Statistics Report</h1>
          <p>University-wide statistics or filtered by individual department</p>
        </div>
        <div className="dashboard-filter-row">
          {/* Academic Year filter */}
          <select
            className="filter-select"
            value={filterYear}
            onChange={function (e) {
              setFilterYear(e.target.value);
            }}
            style={{ minWidth: 160 }}
          >
            <option value="">All Years</option>
            {academicYears.map(function (y) {
              return (
                <option key={y.year_id} value={String(y.year_id)}>
                  {y.year_label}
                </option>
              );
            })}
          </select>

          {/* Department filter */}
          <span className="dashboard-filter-label">View by:</span>
          <select
            className="filter-select"
            value={filterDept}
            onChange={function (e) {
              setFilterDept(e.target.value);
            }}
            style={{ minWidth: 210 }}
          >
            <option value="overall">Entire University</option>
            {departments.map(function (d) {
              return (
                <option key={d.dept_id} value={String(d.dept_id)}>
                  Department: {d.dept_name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="filter-badge-row">
        <div
          className={
            "scope-badge " +
            (isOverall ? "scope-badge--overall" : "scope-badge--dept")
          }
        >
          {isOverall ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              width="14"
              height="14"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              width="14"
              height="14"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          )}
          {isOverall
            ? "University-wide statistics"
            : "Department: " + (data.dept_name || filterDept)}
          {loading && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              Loading...
            </span>
          )}
        </div>
        {error && (
          <div style={{ color: "#dc2626", fontSize: 13, marginLeft: 12 }}>
            {error}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-card--indigo">
          <div className="kpi-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="kpi-val">{data.total_ideas}</div>
          <div className="kpi-label">Total Ideas</div>
          <div className="kpi-sub">
            {isOverall
              ? data.ideas_this_year + " this academic year"
              : "In this department"}
          </div>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <div className="kpi-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="kpi-val">{data.total_comments}</div>
          <div className="kpi-label">Total Comments</div>
          <div className="kpi-sub">Across all ideas</div>
        </div>
        <div className="kpi-card kpi-card--sky">
          <div className="kpi-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-val">{data.total_users}</div>
          <div className="kpi-label">Active Users</div>
          <div className="kpi-sub">
            {isOverall
              ? data.total_departments + " departments"
              : "In this department"}
          </div>
        </div>
        <div className="kpi-card kpi-card--amber">
          <div className="kpi-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div className="kpi-val">{data.anonymous_ideas}</div>
          <div className="kpi-label">Anonymous Ideas</div>
          <div className="kpi-sub">
            is_anonymous = true ·{" "}
            {Math.round(
              (data.anonymous_ideas / (data.total_ideas || 1)) * 100
            )}
            % of total
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-row-2">
        <div className="admin-card chart-card">
          <div className="card-header">
            <span className="card-title">
              Idea Submission Trend (monthly)
            </span>
          </div>
          <div className="card-body">
            {data.monthly_trend.length > 0 ? (
              <BarChart data={data.monthly_trend} color="#6366f1" />
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  padding: "20px 0",
                }}
              >
                No trend data available
              </div>
            )}
          </div>
        </div>
        <div className="admin-card donut-card">
          <div className="card-header">
            <span className="card-title">Ideas With Comments</span>
          </div>
          <div className="card-body donut-card-body">
            <DonutChart
              ideas_with_comments={data.ideas_with_comments}
              ideas_without_comments={data.ideas_without_comments}
            />
          </div>
        </div>
      </div>

      {/* Dept breakdown + Contributors */}
      <div className="dashboard-row-3">
        {isOverall && data.by_department.length > 0 && (
          <div className="admin-card dept-breakdown-card">
            <div className="card-header">
              <span className="card-title">Ideas by Department (dept_id)</span>
            </div>
            <div className="card-body">
              <HorizBar rows={data.by_department} />
            </div>
          </div>
        )}
        <div
          className={
            "admin-card contributors-card " +
            (isOverall ? "" : "contributors-card--full")
          }
        >
          <div className="card-header">
            <span className="card-title">Top Contributors</span>
          </div>
          <div className="card-body">
            {data.top_contributors.length === 0 ? (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  padding: "12px 0",
                }}
              >
                No contributor data available
              </div>
            ) : (
              <div className="contributors-list">
                {data.top_contributors.map(function (c, i) {
                  return (
                    <div key={i} className="contributor-row">
                      <div className="contributor-rank">#{i + 1}</div>
                      <div
                        className={
                          "contributor-avatar avatar-color-" + (i % 5)
                        }
                      >
                        {c.initial}
                      </div>
                      <div className="contributor-info">
                        <div className="contributor-name">{c.full_name}</div>
                        {c.dept_name && (
                          <div className="contributor-dept">
                            {c.dept_name}
                          </div>
                        )}
                      </div>
                      <div className="contributor-badge">
                        {c.idea_count} ideas
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail table (overall only) */}
      {isOverall && data.by_department.length > 0 && (
        <div className="admin-card">
          <div className="card-header">
            <span className="card-title">Breakdown by Department</span>
          </div>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>dept_name (dept_id)</th>
                  <th>idea_count</th>
                  <th>comment_count</th>
                  <th>user_count</th>
                  <th>Contribution %</th>
                </tr>
              </thead>
              <tbody>
                {data.by_department.map(function (row, i) {
                  return (
                    <tr key={row.dept_id}>
                      <td>
                        <div className="dept-name-cell">
                          <div
                            className="dept-dot"
                            style={{
                              background: colors[i % colors.length],
                            }}
                          />
                          {row.dept_name}{" "}
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginLeft: 4,
                            }}
                          >
                            (#{row.dept_id})
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{row.idea_count}</strong>
                      </td>
                      <td>{row.comment_count}</td>
                      <td>{row.user_count}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{
                                width: row.percent + "%",
                                background: colors[i % colors.length],
                              }}
                            />
                          </div>
                          <span className="progress-pct">{row.percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;