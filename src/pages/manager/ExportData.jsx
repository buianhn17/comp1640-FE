import { useState, useEffect } from "react";
import {
  Card, Button, Select, Alert, Tag, Divider,
  Tooltip, Spin, message,
} from "antd";
import {
  DownloadOutlined, FileZipOutlined, FileTextOutlined,
  LockOutlined, CalendarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, InfoCircleOutlined, DatabaseOutlined,
} from "@ant-design/icons";
import { getAcademicYears } from "../../services/academicYearService";
import { exportToCSV, exportAttachmentsAsZip } from "../../services/reportService";
import "../../styles/export-data.css";

const { Option } = Select;
const STEP_IDLE    = "idle";
const STEP_LOADING = "loading";
const STEP_DONE    = "done";

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_ACADEMIC_YEARS = [
  {
    yearId: 1, yearLabel: "2024 – 2025",
    ideaClosureDate: "2025-03-31", finalClosureDate: "2025-04-30",
    commentOpen: false,   // closed → export allowed
  },
  {
    yearId: 2, yearLabel: "2023 – 2024",
    ideaClosureDate: "2024-03-31", finalClosureDate: "2024-04-30",
    commentOpen: false,
  },
  {
    yearId: 3, yearLabel: "2025 – 2026",
    ideaClosureDate: "2026-03-31", finalClosureDate: "2026-04-30",
    commentOpen: true,    // still open → export locked
  },
];

/* ── Mock service wrappers ─────────────────────────────────── */
const mockGetAcademicYears = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_ACADEMIC_YEARS;
};

const mockExportToCSV = async (yearId) => {
  await new Promise((r) => setTimeout(r, 900));
  const year = MOCK_ACADEMIC_YEARS.find((y) => y.yearId === yearId);
  const csv = [
    "IdeaId,Title,Department,Category,Author,Comments",
    "1,Automate Reports,Engineering,Technology,Alice Nguyen,3",
    "2,Green Commute Subsidy,Marketing,Sustainability,Bob Tran,1",
    "3,Mentorship Programme,HR,Training,Carol Le,5",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `ideas_${year?.yearLabel?.replace(/\s/g, "_") ?? yearId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const mockExportAttachmentsAsZip = async () => {
  // Simulate network delay; no real file in mock
  await new Promise((r) => setTimeout(r, 1000));
};

/* ── Resolved service calls ────────────────────────────────── */
const svcGetAcademicYears       = USE_MOCK ? mockGetAcademicYears       : getAcademicYears;
const svcExportToCSV            = USE_MOCK ? mockExportToCSV            : exportToCSV;
const svcExportAttachmentsAsZip = USE_MOCK ? mockExportAttachmentsAsZip : exportAttachmentsAsZip;

/* ═══════════════════════════════════════════════════════════ */

const YearStatusTag = ({ year }) => {
  const isClosed = !year.commentOpen;
  return isClosed
    ? <Tag color="green"  icon={<CheckCircleOutlined />}>Closed</Tag>
    : <Tag color="orange" icon={<ClockCircleOutlined />}>In Progress</Tag>;
};

const ExportData = () => {
  const [academicYears,  setAcademicYears]  = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [fetching,       setFetching]       = useState(true);
  const [csvStep,        setCsvStep]        = useState(STEP_IDLE);
  const [zipStep,        setZipStep]        = useState(STEP_IDLE);

  useEffect(() => {
    const fetch = async () => {
      setFetching(true);
      try {
        const data = await svcGetAcademicYears();
        setAcademicYears(data ?? []);
        if (data?.length > 0) setSelectedYearId(data[0].yearId);
      } catch {
        message.error("Failed to load academic years");
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, []);

  const selectedYear   = academicYears.find((y) => y.yearId === selectedYearId) ?? null;
  const exportAllowed  = selectedYear && !selectedYear.commentOpen;

  const handleExportCSV = async () => {
    if (!exportAllowed) return;
    setCsvStep(STEP_LOADING);
    try {
      await svcExportToCSV(selectedYearId);
      setCsvStep(STEP_DONE);
      message.success("CSV exported successfully!");
      setTimeout(() => setCsvStep(STEP_IDLE), 3000);
    } catch (err) {
      message.error(err?.response?.data?.message || "Export CSV failed");
      setCsvStep(STEP_IDLE);
    }
  };

  const handleExportZIP = async () => {
    if (!exportAllowed) return;
    setZipStep(STEP_LOADING);
    try {
      await svcExportAttachmentsAsZip(selectedYearId);
      message.success("ZIP downloaded successfully!");
      setZipStep(STEP_DONE);
      setTimeout(() => setZipStep(STEP_IDLE), 3000);
    } catch (err) {
      message.error(err?.response?.data?.message || "Export ZIP failed");
      setZipStep(STEP_IDLE);
    }
  };

  return (
    <div className="exp-page">
      <div className="exp-page-header">
        <div className="exp-page-title-block">
          <DatabaseOutlined className="exp-page-icon" />
          <div>
            <h2 className="exp-page-title">
              Export Data
            </h2>
            <p className="exp-page-sub">Download ideas and attachments after final closure date</p>
          </div>
        </div>
      </div>

      <Alert
        type="info" showIcon icon={<InfoCircleOutlined />}
        className="exp-info-alert"
        message="Export Availability"
        description="Both CSV and ZIP exports are only available after the academic year's comment closure date."
      />

      <Card className="exp-selector-card">
        <div className="exp-selector-header">
          <CalendarOutlined className="exp-selector-icon" />
          <div>
            <p className="exp-selector-title">Select Academic Year</p>
            <p className="exp-selector-sub">Choose the year you want to export data from</p>
          </div>
        </div>
        <Spin spinning={fetching}>
          <Select
            placeholder="Select an academic year..."
            value={selectedYearId}
            onChange={setSelectedYearId}
            style={{ width: "100%", maxWidth: 480 }}
            size="large"
          >
            {academicYears.map((y) => (
              <Option key={y.yearId} value={y.yearId}>
                <div className="exp-year-option">
                  <span className="exp-year-option-label">{y.yearLabel}</span>
                  <YearStatusTag year={y} />
                </div>
              </Option>
            ))}
          </Select>
        </Spin>

        {selectedYear && (
          <div className="exp-year-summary">
            <div className="exp-year-stat">
              <span className="exp-year-stat-val">{selectedYear.ideaClosureDate}</span>
              <span className="exp-year-stat-key">Idea Closure</span>
            </div>
            <div className="exp-year-divider" />
            <div className="exp-year-stat">
              <span className="exp-year-stat-val">{selectedYear.finalClosureDate}</span>
              <span className="exp-year-stat-key">Final Closure</span>
            </div>
            <div className="exp-year-divider" />
            <div className="exp-year-stat">
              <YearStatusTag year={selectedYear} />
              <span className="exp-year-stat-key">Status</span>
            </div>
          </div>
        )}

        {selectedYear && !exportAllowed && (
          <Alert
            type="warning" showIcon icon={<LockOutlined />}
            className="exp-locked-alert"
            message={`Export locked — ${selectedYear.yearLabel} is still in progress`}
            description="Export will be available after the final closure date."
          />
        )}
      </Card>

      <div className="exp-options-grid">
        {/* CSV */}
        <Card className={`exp-option-card ${!exportAllowed ? "exp-option-card--locked" : ""}`}>
          <div className="exp-option-icon-wrap exp-option-icon-csv">
            <FileTextOutlined />
          </div>
          <h3 className="exp-option-title">Export CSV</h3>
          <p className="exp-option-desc">
            Download all ideas and their comments as a structured CSV file including real author names.
          </p>
          <ul className="exp-feature-list">
            <li>✓ All ideas for selected year</li>
            <li>✓ All comments with real author names</li>
            <li>✓ Department &amp; category breakdown</li>
            <li>✓ UTF-8 encoded, Excel-compatible</li>
          </ul>
          <Divider className="exp-divider" />
          <Tooltip title={
            !selectedYear    ? "Select an academic year first"
            : !exportAllowed ? "Export locked — year not yet closed"
            : ""
          }>
            <Button
              type="primary" size="large" block
              icon={csvStep === STEP_DONE ? <CheckCircleOutlined /> : <DownloadOutlined />}
              onClick={handleExportCSV}
              disabled={!exportAllowed || csvStep === STEP_LOADING}
              loading={csvStep === STEP_LOADING}
              className={`exp-download-btn exp-download-btn--csv ${csvStep === STEP_DONE ? "exp-btn-done" : ""}`}
            >
              {csvStep === STEP_LOADING ? "Preparing CSV…"
                : csvStep === STEP_DONE ? "Downloaded!"
                : "Download CSV"}
            </Button>
          </Tooltip>
        </Card>

        {/* ZIP */}
        <Card className={`exp-option-card ${!exportAllowed ? "exp-option-card--locked" : ""}`}>
          <div className="exp-option-icon-wrap exp-option-icon-zip">
            <FileZipOutlined />
          </div>
          <h3 className="exp-option-title">Export ZIP</h3>
          <p className="exp-option-desc">
            Download all uploaded attachments bundled into a single ZIP archive organised by idea ID.
          </p>
          <ul className="exp-feature-list">
            <li>✓ All attachments for selected year</li>
            <li>✓ Organised by idea ID folder</li>
            <li>✓ Includes all file types</li>
            <li>✓ Compressed for fast download</li>
          </ul>
          <Divider className="exp-divider" />
          <Tooltip title={
            !selectedYear    ? "Select an academic year first"
            : !exportAllowed ? "Export locked — year not yet closed"
            : ""
          }>
            <Button
              size="large" block
              icon={zipStep === STEP_DONE ? <CheckCircleOutlined /> : <FileZipOutlined />}
              onClick={handleExportZIP}
              disabled={!exportAllowed || zipStep === STEP_LOADING}
              loading={zipStep === STEP_LOADING}
              className={`exp-download-btn exp-download-btn--zip ${zipStep === STEP_DONE ? "exp-btn-done" : ""}`}
            >
              {zipStep === STEP_LOADING ? "Packaging ZIP…"
                : zipStep === STEP_DONE ? "Downloaded!"
                : "Download ZIP"}
            </Button>
          </Tooltip>
        </Card>
      </div>
    </div>
  );
};

export default ExportData;