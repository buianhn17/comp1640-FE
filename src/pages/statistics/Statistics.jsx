import { useEffect, useState } from "react";
import { Spin, Table, Card, Statistic, Row, Col, Select, Button, message, Space } from "antd";
import { BarChartOutlined, FileExcelOutlined } from "@ant-design/icons";
import { getAcademicYears } from "../../services/academicYearService";
import { getStatisticsReport, exportToCSV, exportAttachmentsAsZip } from "../../services/reportService";

const { Option } = Select;

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_ACADEMIC_YEARS = [
  { yearId: 1, yearLabel: "2024 – 2025", ideaClosureDate: "2025-03-31", finalClosureDate: "2025-04-30", commentOpen: false },
  { yearId: 2, yearLabel: "2023 – 2024", ideaClosureDate: "2024-03-31", finalClosureDate: "2024-04-30", commentOpen: false },
  { yearId: 3, yearLabel: "2022 – 2023", ideaClosureDate: "2023-03-31", finalClosureDate: "2023-04-30", commentOpen: false },
];

const MOCK_STATISTICS = [
  { deptId: 1, deptName: "Engineering",       ideaCount: 42, percentageOfTotal: 32, contributorCount: 18 },
  { deptId: 2, deptName: "Marketing",         ideaCount: 28, percentageOfTotal: 21, contributorCount: 11 },
  { deptId: 3, deptName: "Human Resources",   ideaCount: 19, percentageOfTotal: 14, contributorCount:  9 },
  { deptId: 4, deptName: "Finance",           ideaCount: 16, percentageOfTotal: 12, contributorCount:  7 },
  { deptId: 5, deptName: "Product",           ideaCount: 14, percentageOfTotal: 11, contributorCount:  6 },
  { deptId: 6, deptName: "Customer Support",  ideaCount: 12, percentageOfTotal: 10, contributorCount:  5 },
];

/* ── Mock service wrappers ─────────────────────────────────── */
const mockGetAcademicYears = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_ACADEMIC_YEARS;
};

const mockGetStatisticsReport = async (yearId, deptId) => {
  await new Promise((r) => setTimeout(r, 500));
  if (deptId) return MOCK_STATISTICS.filter((s) => s.deptId === deptId);
  return MOCK_STATISTICS;
};

const mockExportToCSV = async () => {
  await new Promise((r) => setTimeout(r, 800));
  // Simulate file download with a Blob
  const csv = ["Department,Ideas,% of Total,Contributors",
    ...MOCK_STATISTICS.map((s) =>
      `${s.deptName},${s.ideaCount},${s.percentageOfTotal}%,${s.contributorCount}`),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "statistics_mock.csv"; a.click();
  URL.revokeObjectURL(url);
};

const mockExportAttachmentsAsZip = async () => {
  await new Promise((r) => setTimeout(r, 800));
  // No-op in mock — just simulates the delay
};

/* ── Resolved service calls ────────────────────────────────── */
const svcGetAcademicYears     = USE_MOCK ? mockGetAcademicYears     : getAcademicYears;
const svcGetStatisticsReport  = USE_MOCK ? mockGetStatisticsReport  : getStatisticsReport;
const svcExportToCSV          = USE_MOCK ? mockExportToCSV          : exportToCSV;
const svcExportAttachmentsAsZip = USE_MOCK ? mockExportAttachmentsAsZip : exportAttachmentsAsZip;

/* ═══════════════════════════════════════════════════════════ */

const Statistics = () => {
  const [academicYears,  setAcademicYears]  = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [statistics,     setStatistics]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [fetchingYears,  setFetchingYears]  = useState(true);

  /* ── Load academic years ─────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setFetchingYears(true);
      try {
        const data = await svcGetAcademicYears();
        setAcademicYears(data ?? []);
        if (data?.length > 0) setSelectedYearId(data[0].yearId);
      } catch {
        message.error("Failed to load academic years");
      } finally {
        setFetchingYears(false);
      }
    };
    fetch();
  }, []);

  /* ── Load statistics khi đổi year/dept ──────────────────── */
  useEffect(() => {
    if (!selectedYearId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await svcGetStatisticsReport(selectedYearId, selectedDeptId);
        setStatistics(data ?? []);
      } catch {
        message.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedYearId, selectedDeptId]);

  const totalIdeas        = statistics.reduce((s, d) => s + d.ideaCount, 0);
  const totalContributors = statistics.reduce((s, d) => s + d.contributorCount, 0);

  const columns = [
    {
      title: "Department",
      dataIndex: "deptName",
      key: "deptName",
      sorter: (a, b) => a.deptName.localeCompare(b.deptName),
    },
    {
      title: "Ideas",
      dataIndex: "ideaCount",
      key: "ideaCount",
      sorter: (a, b) => a.ideaCount - b.ideaCount,
      align: "center",
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: "% of Total",
      dataIndex: "percentageOfTotal",
      key: "percentageOfTotal",
      sorter: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
      align: "center",
      render: (v) => `${v}%`,
    },
    {
      title: "Contributors",
      dataIndex: "contributorCount",
      key: "contributorCount",
      sorter: (a, b) => a.contributorCount - b.contributorCount,
      align: "center",
      render: (v) => <strong>{v}</strong>,
    },
  ];

  const handleExportCSV = async () => {
    try {
      await svcExportToCSV(selectedYearId);
      message.success("CSV exported successfully");
    } catch {
      message.error("Failed to export CSV");
    }
  };

  const handleExportZip = async () => {
    try {
      await svcExportAttachmentsAsZip(selectedYearId);
      message.success("ZIP exported successfully");
    } catch {
      message.error("Failed to export ZIP");
    }
  };

  return (
    <Spin spinning={fetchingYears}>
      <div style={{ padding: "24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          System Statistics
        </h1>
        <p style={{ color: "#64748b", marginBottom: 24 }}>
          Overview of idea contributions by department
        </p>

        <Card style={{ marginBottom: 24 }}>
          <Space size="large" wrap>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Academic Year</label>
              <Select
                value={selectedYearId}
                onChange={setSelectedYearId}
                style={{ width: 220 }}
                placeholder="Select Year"
              >
                {academicYears.map((y) => (
                  <Option key={y.yearId} value={y.yearId}>{y.yearLabel}</Option>
                ))}
              </Select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                Department Filter (Optional)
              </label>
              <Select
                value={selectedDeptId}
                onChange={setSelectedDeptId}
                style={{ width: 200 }}
                placeholder="All Departments"
                allowClear
              >
                {statistics.map((s) => (
                  <Option key={s.deptId} value={s.deptId}>{s.deptName}</Option>
                ))}
              </Select>
            </div>
          </Space>
        </Card>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic title="Total Ideas"           value={totalIdeas}        prefix={<BarChartOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic title="Departments Involved"  value={statistics.length} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic title="Total Contributors"    value={totalContributors} />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
            Statistics by Department
          </h3>
          <Table
            columns={columns}
            dataSource={statistics}
            rowKey="deptId"
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </Card>

        <Space>
          <Button
            type="primary" icon={<FileExcelOutlined />}
            onClick={handleExportCSV}
            disabled={!selectedYearId || totalIdeas === 0}
          >
            Export Ideas &amp; Comments CSV
          </Button>
          <Button
            onClick={handleExportZip}
            disabled={!selectedYearId || totalIdeas === 0}
          >
            Export Attachments ZIP
          </Button>
        </Space>
      </div>
    </Spin>
  );
};

export default Statistics;