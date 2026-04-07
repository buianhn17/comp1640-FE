import { useState, useEffect } from "react";
import {
  Table, Button, Modal, Form, Input, Tag, Space, Tooltip,
  Popconfirm, message, Badge, Empty, Card, Spin,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined,
  CheckCircleOutlined, StopOutlined, SearchOutlined,
} from "@ant-design/icons";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import "../../styles/category-management.css";

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data store (mutated in place to simulate DB) ─────── */
let mockCategoryStore = [
  { categoryId: 1, categoryName: "Process Improvement",  description: "Ideas to streamline workflows and reduce waste.",           isUsed: true,  createdAt: "2024-09-01T08:00:00Z" },
  { categoryId: 2, categoryName: "Cost Reduction",       description: "Proposals that help cut operational or material costs.",    isUsed: true,  createdAt: "2024-09-03T09:15:00Z" },
  { categoryId: 3, categoryName: "Customer Experience",  description: "Improving satisfaction and service quality for clients.",   isUsed: true,  createdAt: "2024-09-05T10:30:00Z" },
  { categoryId: 4, categoryName: "Employee Well-being",  description: "Initiatives around health, culture, and work-life balance.",isUsed: false, createdAt: "2024-09-10T11:00:00Z" },
  { categoryId: 5, categoryName: "Technology & Tools",   description: "Suggestions related to new software, hardware, or systems.",isUsed: true,  createdAt: "2024-09-12T13:45:00Z" },
  { categoryId: 6, categoryName: "Sustainability",       description: "Environmental and green initiatives.",                      isUsed: false, createdAt: "2024-09-15T14:20:00Z" },
  { categoryId: 7, categoryName: "Training & Development",description: "Learning programs, mentorship, and skill-building.",      isUsed: false, createdAt: "2024-09-18T09:00:00Z" },
];
let mockNextId = 8;

/* ── Mock service wrappers ─────────────────────────────────── */
const mockGetCategories = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return [...mockCategoryStore];
};

const mockCreateCategory = async (payload) => {
  await new Promise((r) => setTimeout(r, 350));
  const newCat = {
    categoryId: mockNextId++,
    categoryName: payload.categoryName,
    description: payload.description ?? "",
    isUsed: false,
    createdAt: new Date().toISOString(),
  };
  mockCategoryStore.push(newCat);
  return newCat;
};

const mockUpdateCategory = async (id, payload) => {
  await new Promise((r) => setTimeout(r, 350));
  mockCategoryStore = mockCategoryStore.map((c) =>
    c.categoryId === id ? { ...c, ...payload } : c
  );
};

const mockDeleteCategory = async (id) => {
  await new Promise((r) => setTimeout(r, 300));
  const target = mockCategoryStore.find((c) => c.categoryId === id);
  if (target?.isUsed) throw { response: { data: { message: "Cannot delete: category is in use." } } };
  mockCategoryStore = mockCategoryStore.filter((c) => c.categoryId !== id);
};

/* ── Resolved service calls ────────────────────────────────── */
const svcGetCategories  = USE_MOCK ? mockGetCategories  : getCategories;
const svcCreateCategory = USE_MOCK ? mockCreateCategory : createCategory;
const svcUpdateCategory = USE_MOCK ? mockUpdateCategory : updateCategory;
const svcDeleteCategory = USE_MOCK ? mockDeleteCategory : deleteCategory;

/* ═══════════════════════════════════════════════════════════ */

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [form] = Form.useForm();

  /* ── Fetch ───────────────────────────────────────────────── */
  const fetchCategories = async () => {
    setFetching(true);
    try {
      const data = await svcGetCategories();
      setCategories(data ?? []);
    } catch {
      message.error("Failed to load categories");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  /* ── Filtered ────────────────────────────────────────────── */
  const filtered = categories.filter((c) =>
    c.categoryName.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ── Open modal ──────────────────────────────────────────── */
  const openAdd = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (record) => {
    setEditTarget(record);
    form.setFieldsValue({ categoryName: record.categoryName, description: record.description });
    setModalOpen(true);
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    try {
      const values  = await form.validateFields();
      const trimmed = values.categoryName.trim();

      const duplicate = categories.find(
        (c) => c.categoryName.toLowerCase() === trimmed.toLowerCase()
          && c.categoryId !== editTarget?.categoryId
      );
      if (duplicate) {
        form.setFields([{ name: "categoryName", errors: ["Category name already exists."] }]);
        return;
      }

      setLoading(true);
      const payload = { categoryName: trimmed, description: values.description || "" };

      if (editTarget) {
        await svcUpdateCategory(editTarget.categoryId, payload);
        message.success("Category updated successfully.");
      } else {
        await svcCreateCategory(payload);
        message.success("Category added successfully.");
      }

      await fetchCategories();
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.response) {
        message.error(err?.response?.data?.message || "Operation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Delete ──────────────────────────────────────────────── */
  const handleDelete = async (record) => {
    if (record.isUsed) {
      message.error("Cannot delete: this category is assigned to one or more ideas.");
      return;
    }
    setLoading(true);
    try {
      await svcDeleteCategory(record.categoryId);
      message.success("Category deleted.");
      await fetchCategories();
    } catch (err) {
      message.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Columns ─────────────────────────────────────────────── */
  const columns = [
    {
      title: "#",
      key: "idx",
      width: 60,
      render: (_, __, idx) => <span className="cat-row-num">{idx + 1}</span>,
    },
    {
      title: "Category Name",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (name) => (
        <span className="cat-name">
          <TagsOutlined className="cat-name-icon" /> {name}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (d) => d || <span style={{ color: "#94a3b8" }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "isUsed",
      key: "isUsed",
      width: 130,
      filters: [
        { text: "In Use",    value: true  },
        { text: "Available", value: false },
      ],
      onFilter: (value, record) => record.isUsed === value,
      render: (used) =>
        used
          ? <Badge status="processing" text={<span className="cat-badge-used">In Use</span>} />
          : <Badge status="default"    text={<span className="cat-badge-free">Available</span>} />,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (d) => (
        <span className="cat-date">
          {d ? new Date(d).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit">
            <Button
              type="text" size="small" icon={<EditOutlined />}
              className="cat-action-btn cat-action-edit"
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isUsed ? "Cannot delete: in use" : "Delete"}>
            <Popconfirm
              title="Delete category?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record)}
              okText="Delete" okType="danger" cancelText="Cancel"
              disabled={record.isUsed}
            >
              <Button
                type="text" size="small" icon={<DeleteOutlined />}
                className="cat-action-btn cat-action-delete"
                disabled={record.isUsed} danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="cat-page">
      <div className="cat-page-header">
        <div className="cat-page-title-block">
          <TagsOutlined className="cat-page-icon" />
          <div>
            <h2 className="cat-page-title">
              Category Management
            </h2>
            <p className="cat-page-sub">
              {categories.length} categories &bull; {categories.filter((c) => c.isUsed).length} in use
            </p>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="cat-add-btn">
          Add Category
        </Button>
      </div>

      <div className="cat-summary-row">
        <div className="cat-pill cat-pill-blue">
          <CheckCircleOutlined />
          <span>{categories.filter((c) => c.isUsed).length} In Use</span>
        </div>
        <div className="cat-pill cat-pill-gray">
          <StopOutlined />
          <span>{categories.filter((c) => !c.isUsed).length} Available</span>
        </div>
      </div>

      <Card className="cat-table-card">
        <div className="cat-search-row">
          <Input
            placeholder="Search categories..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="cat-search-input"
          />
        </div>
        <Spin spinning={fetching}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="categoryId"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="No categories found" /> }}
            className="cat-table"
          />
        </Spin>
      </Card>

      <Modal
        title={
          <span className="cat-modal-title">
            {editTarget
              ? <><EditOutlined /> &nbsp;Edit Category</>
              : <><PlusOutlined /> &nbsp;Add New Category</>}
          </span>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editTarget ? "Save Changes" : "Add Category"}
        confirmLoading={loading}
        destroyOnClose
        className="cat-modal"
      >
        <Form form={form} layout="vertical" className="cat-form">
          <Form.Item
            name="categoryName"
            label="Category Name"
            rules={[
              { required: true, message: "Please enter a category name." },
              { min: 2, message: "Must be at least 2 characters." },
              { max: 80, message: "Must be at most 80 characters." },
            ]}
          >
            <Input placeholder="e.g. Process Improvement" maxLength={80} showCount autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional description..." rows={3} maxLength={255} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;