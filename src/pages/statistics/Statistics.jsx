import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Spin, Table, Card, Statistic, Row, Col, Select, Button, message, Space, Alert } from "antd";
import { BarChartOutlined, FileExcelOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { ROLES } from "../../constants/roles";
import { getAcademicYears } from "../../services/academicYearService";
import { getStatisticsReport, exportToCSV, exportAttachmentsAsZip } from "../../services/reportService";

const { Option } = Select;
const FULL_ACCESS_ROLES = [ROLES.ADMIN, ROLES.QA_MANAGER];

const Statistics = () => {
  const user = useSelector((state) => state.auth.user);
  const hasFullAccess = FULL_ACCESS_ROLES.includes(user?.role);

  // 1. 🔥 FIX: Khớp chính xác với trường 'departmentId' trong Console của bạn
  const userDeptId = user?.departmentId || user?.deptId || user?.department_id || null;
  const userDeptName = user?.deptName || user?.role || "Department";

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [statistics, setStatistics] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [fetchingYears, setFetchingYears] = useState(true);

  // selectedDeptId: Mặc định lấy userDeptId nếu không phải Admin
  const [selectedDeptId, setSelectedDeptId] = useState(hasFullAccess ? null : userDeptId);

  // Cập nhật lại selectedDeptId nếu ban đầu userDeptId bị null do load chậm
  useEffect(() => {
    if (!hasFullAccess && userDeptId && !selectedDeptId) {
      setSelectedDeptId(userDeptId);
    }
  }, [userDeptId, hasFullAccess, selectedDeptId]);

  // Load Years
  useEffect(() => {
    const fetchYears = async () => {
      setFetchingYears(true);
      try {
        const data = await getAcademicYears();
        setAcademicYears(data ?? []);
        if (data?.length > 0) setSelectedYearId(data[0].yearId);
      } catch { message.error("Failed to load years"); }
      finally { setFetchingYears(false); }
    };
    fetchYears();
  }, []);

  // Load Data Report
  useEffect(() => {
    if (!selectedYearId) return;
    
    // Nếu là Manager mà vẫn chưa lấy được ID thì không gọi API
    if (!hasFullAccess && !userDeptId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const deptIdToFetch = hasFullAccess ? selectedDeptId : userDeptId;
        const data = await getStatisticsReport(selectedYearId, deptIdToFetch);
        setStatistics(data ?? []);
      } catch { message.error("Failed to load statistics"); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [selectedYearId, selectedDeptId, hasFullAccess, userDeptId]);

  /* ─── LOGIC LỌC DỮ LIỆU (Chỉ hiện 1 dòng cho Manager) ─── */
  const filteredData = useMemo(() => {
    if (!statistics || statistics.length === 0) return [];

    if (hasFullAccess) {
      if (!selectedDeptId) return statistics; 
      // So sánh linh hoạt các tên trường ID trong mảng trả về
      return statistics.filter(s => String(s.deptId || s.dept_id || s.departmentId) === String(selectedDeptId));
    }

    // Đối với Manager: Chỉ hiện duy nhất dòng phòng ban của mình
    // String() để tránh lỗi so sánh 1 (number) với "1" (string)
    return statistics.filter(s => String(s.deptId || s.dept_id || s.departmentId) === String(userDeptId));
  }, [statistics, hasFullAccess, selectedDeptId, userDeptId]);

  const totalIdeas = filteredData.reduce((s, d) => s + (d.ideaCount || d.idea_count || 0), 0);
  const totalContributors = filteredData.reduce((s, d) => s + (d.contributorCount || d.contributor_count || 0), 0);

  const columns = [
    { 
      title: "Department", 
      dataIndex: "deptName", 
      key: "deptName",
      render: (text, record) => text || record.dept_name 
    },
    { title: "Ideas", dataIndex: "ideaCount", key: "ideaCount", align: "center", render: (v, record) => <strong>{v ?? record.idea_count}</strong> },
    { title: "Contributors", dataIndex: "contributorCount", key: "contributorCount", align: "center", render: (v, record) => v ?? record.contributor_count },
    { title: "% of Total", dataIndex: "percentageOfTotal", key: "percentageOfTotal", align: "center", render: (v, record) => `${v ?? record.percentage_of_total}%` },
  ];

  return (
    <Spin spinning={fetchingYears}>
      <div style={{ padding: "24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          System Statistics
        </h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          {hasFullAccess ? "University-wide Dashboard" : `Department Dashboard: ${userDeptName}`}
        </p>

        {/* 2. 🔥 CẢNH BÁO LỖI: Chỉ hiện khi thực sự không tìm thấy ID sau khi đã load xong */}
        {!hasFullAccess && !userDeptId && !fetchingYears && (
          <Alert
            message="Error: Department ID not found"
            description="Your account is not linked to any department. Please contact Admin."
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Card style={{ marginBottom: 24, borderRadius: 8 }}>
          <Space size="large" wrap>
            <div>
              <span style={{ marginRight: 8 }}>Academic Year:</span>
              <Select value={selectedYearId} onChange={setSelectedYearId} style={{ width: 150 }}>
                {academicYears.map(y => <Option key={y.yearId} value={y.yearId}>{y.yearLabel}</Option>)}
              </Select>
            </div>

            {hasFullAccess && (
              <div>
                <span style={{ marginRight: 8 }}>Filter Department:</span>
                <Select
                  value={selectedDeptId}
                  onChange={setSelectedDeptId}
                  style={{ width: 200 }}
                  placeholder="All Departments"
                  allowClear
                >
                  {statistics.map(s => (
                    <Option key={s.deptId || s.dept_id} value={s.deptId || s.dept_id}>
                      {s.deptName || s.dept_name}
                    </Option>
                  ))}
                </Select>
              </div>
            )}
          </Space>
        </Card>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}><Card bordered={false}><Statistic title="Ideas" value={totalIdeas} /></Card></Col>
          <Col span={8}><Card bordered={false}><Statistic title="Contributors" value={totalContributors} /></Card></Col>
          <Col span={8}><Card bordered={false}><Statistic title="View Scope" value={hasFullAccess ? "Full" : "Local"} /></Card></Col>
        </Row>

        <Card title="Detailed Data">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record) => record.deptId || record.dept_id}
            loading={loading}
            pagination={hasFullAccess}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default Statistics;