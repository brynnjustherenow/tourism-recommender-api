import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  Empty,
  message,
  Tag,
  Image,
  Drawer,
  Descriptions,
  Popconfirm,
  Rate,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  TagOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import RegionSelector from "@components/RegionSelector";
import {
  getAdminDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  getAdminDestinationDetail,
  getAdminRecommendors,
} from "@services/api";
import { uploadImage } from "../services/upload";
import Login from "./Login";

const { TextArea } = Input;
const DestinationManagement = () => {
  const [destinations, setDestinations] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    recommendorId: undefined,
    regionCode: undefined,
    status: undefined,
    tags: undefined,
  });
  const [imageUrl, setImageUrl] = useState(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [editingDestination, setEditingDestination] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Drawer states
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Recommendors list for select
  const [recommendors, setRecommendors] = useState([]);

  // Load destinations
  const loadDestinations = async (page = 1) => {
    setTableLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...filters,
      };

      // Remove undefined filters
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === "") {
          delete params[key];
        }
      });

      const response = await getAdminDestinations(params);
      setDestinations(response.data || []);
      setTotal(response.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setTableLoading(false);
    }
  };

  // Load recommendors for select
  const loadRecommendors = async () => {
    try {
      const response = await getAdminRecommendors({ pageSize: 1000 });
      setRecommendors(response.data || []);
    } catch (error) {
      console.error("Error loading recommendors:", error);
    }
  };

  // Initial load
  useEffect(() => {
    loadDestinations();
    loadRecommendors();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // Search
  const handleSearch = () => {
    loadDestinations(1);
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      name: "",
      recommendorId: undefined,
      regionCode: undefined,
      status: undefined,
      tags: undefined,
    });
    loadDestinations(1);
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode("create");
    setEditingDestination(null);
    form.resetFields();
    setImageUrl(null);
    setModalVisible(true);
  };

  // Open edit modal
  const handleEdit = async (destination) => {
    setModalMode("edit");
    setEditingDestination(destination);

    try {
      const detail = await getAdminDestinationDetail(destination.id);
      const regionInfo = detail.region
        ? {
            codes: [
              detail.region.provinceCode,
              detail.region.cityCode,
              detail.region.districtCode,
            ],
            names: detail.region.fullAddress,
          }
        : null;

      form.setFieldsValue({
        ...detail,
        region: regionInfo,
        recommendorId: detail.recommendor?.id,
        tags: detail.tags || [],
      });

      if (detail.image) {
        setImageUrl(detail.image);
      }

      setModalVisible(true);
    } catch (error) {
      console.error("Error loading destination detail:", error);
      message.error("加载目的地详情失败");
    }
  };

  // Delete destination
  const handleDelete = async (id) => {
    try {
      await deleteDestination(id);
      message.success("删除成功");
      loadDestinations(currentPage);
    } catch (error) {
      console.error("Error deleting destination:", error);
    }
  };

  // Show detail
  const handleShowDetail = async (destination) => {
    setDetailDrawerVisible(true);
    setDetailLoading(true);
    try {
      const detail = await getAdminDestinationDetail(destination.id);
      setDetailData(detail);
    } catch (error) {
      console.error("Error loading detail:", error);
      message.error("加载详情失败");
    } finally {
      setDetailLoading(false);
    }
  };
  const handleImageUpload = async (file) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadImage(file);
      const imageUrl = response.url;
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("上传图片失败");
    } finally {
      setImageUploading(false);
    }
  };
  // Form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      values.address = values.region.names ? values.region.names : "未知地区";
      const data = {
        ...values,
        recommendor_id: values.recommendorId,
        tags: values.tags || [],
      };

      // Handle region
      if (values.region) {
        data.regionCode = values.region.codes[2]; // Use district code
        data.regionName = values.region.names;
      }

      // Handle image - 修改这里
      if (imageUrl) {
        data.image = imageUrl;
      }

      // ... 后续代码保持不变
      if (modalMode === "create") {
        await createDestination(data);
      } else {
        await updateDestination(editingDestination.id, data);
      }

      message.success(modalMode === "create" ? "创建成功" : "更新成功");
      setModalVisible(false);
      form.resetFields();
      // 重置图片状态
      setImageUrl(null);
      loadDestinations(currentPage);
    } catch (error) {
      console.error("Error saving destination:", error);
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "图片",
      dataIndex: "image",
      key: "image",
      width: 100,
      render: (image) => (
        <Image
          src={image}
          alt="destination"
          width={60}
          height={60}
          style={{ objectFit: "cover" }}
          fallback={
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无图片"
            />
          }
        />
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "推荐官",
      dataIndex: ["recommendor", "name"],
      key: "recommendor",
      width: 120,
      render: (name, record) => name || "-",
    },
    {
      title: "地区",
      dataIndex: ["region", "name"],
      key: "region",
      width: 150,
    },
    {
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      width: 120,
      render: (rating) => <Rate disabled defaultValue={rating} allowHalf />,
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 150,
      render: (tags) => (
        <>
          {tags?.map((tag) => (
            <Tag key={tag} icon={<TagOutlined />}>
              {tag}
            </Tag>
          )) || "-"}
        </>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "活跃" : "非活跃"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 240,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleShowDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个目的地吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Filter Card */}
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" style={{ width: "100%" }}>
          <Form.Item label="名称">
            <Input
              placeholder="请输入名称"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              style={{ width: 200 }}
            />
          </Form.Item>

          <Form.Item label="推荐官">
            <Select
              placeholder="请选择推荐官"
              value={filters.recommendorId}
              onChange={(value) => handleFilterChange("recommendorId", value)}
              style={{ width: 150 }}
              allowClear
            >
              {recommendors.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="地区">
            <RegionSelector
              placeholder="请选择地区"
              value={filters.regionCode}
              onChange={(value) =>
                setFilters({ ...filters, regionCode: value })
              }
              style={{ width: 250 }}
            />
          </Form.Item>

          <Form.Item label="状态">
            <Select
              placeholder="请选择状态"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">非活跃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={destinations}
          rowKey="id"
          loading={tableLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
              loadDestinations(page);
            },
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={modalMode === "create" ? "添加目的地" : "编辑目的地"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setImageUrl(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="图片" name="image">
            <Upload showUploadList={false} beforeUpload={handleImageUpload}>
              {imageUrl ||
              (modalMode === "edit" && editingDestination?.image) ? (
                <img
                  src={
                    imageUrl ||
                    (modalMode === "edit" ? editingDestination?.image : "")
                  }
                  alt="image"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div>
                  {imageUploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>
                    {imageUploading ? "上传中" : "上传图片"}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: "请输入描述" }]}
          >
            <TextArea
              placeholder="请输入描述"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="推荐官"
            name="recommendorId"
            rules={[{ required: true, message: "请选择推荐官" }]}
          >
            <Select placeholder="请选择推荐官">
              {recommendors.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="地区"
            name="region"
            rules={[{ required: true, message: "请选择地区" }]}
          >
            <RegionSelector
              placeholder="请选择省/市/区"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label="详细地址" name="address">
            <Input
              placeholder="请输入详细地址"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item label="评分" name="rating" initialValue={4.5}>
            <Rate allowHalf />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select
              mode="tags"
              placeholder="请输入标签（按回车添加）"
              style={{ width: "100%" }}
            >
              <Select.Option value="热门">热门</Select.Option>
              <Select.Option value="推荐">推荐</Select.Option>
              <Select.Option value="网红">网红</Select.Option>
              <Select.Option value="亲子">亲子</Select.Option>
              <Select.Option value="度假">度假</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="状态" name="status" initialValue="active">
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">非活跃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setImageUrl(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {modalMode === "create" ? "创建" : "更新"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="目的地详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {detailData && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Image
                src={detailData.image}
                alt={detailData.name}
                width={300}
                height={200}
                style={{ objectFit: "cover", marginBottom: 16 }}
              />
              <h2>{detailData.name}</h2>
              <Tag color={detailData.status === "active" ? "green" : "red"}>
                {detailData.status === "active" ? "活跃" : "非活跃"}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="描述">
                {detailData.description}
              </Descriptions.Item>
              <Descriptions.Item label="推荐官">
                {detailData.recommendor?.name}
              </Descriptions.Item>
              <Descriptions.Item label="地区">
                {detailData.region?.name}
              </Descriptions.Item>
              <Descriptions.Item label="详细地址">
                {detailData.address || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                <Rate disabled defaultValue={detailData.rating} allowHalf />{" "}
                {detailData.rating}
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space wrap>
                  {detailData.tags?.map((tag) => (
                    <Tag key={tag} icon={<TagOutlined />}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detailData.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(detailData.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DestinationManagement;
