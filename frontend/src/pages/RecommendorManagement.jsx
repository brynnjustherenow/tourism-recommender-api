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
  DatePicker,
  InputNumber,
  Upload,
  message,
  Tag,
  Image,
  Drawer,
  Descriptions,
  Avatar,
  Popconfirm,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  FileImageOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import RegionSelector from "@components/RegionSelector";
import {
  getAdminRecommendors,
  createRecommendor,
  updateRecommendor,
  deleteRecommendor,
  regenerateQRCodes,
  getAdminRecommendorDetail,
} from "@services/api";
import { uploadAvatar, validateImageFile } from "@services/upload";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const RecommendorManagement = () => {
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [recommendors, setRecommendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    gender: undefined,
    regionCode: undefined,
    status: undefined,
    minAge: undefined,
    maxAge: undefined,
  });

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [editingRecommendor, setEditingRecommendor] = useState(null);
  const [form] = Form.useForm();

  // QR Code Drawer states
  const [qrDrawerVisible, setQrDrawerVisible] = useState(false);
  const [currentQRRecommendor, setCurrentQRRecommendor] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Detail Drawer states
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Upload states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Load recommendors
  const loadRecommendors = async (page = 1) => {
    setTableLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };

      // Remove undefined filters
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === "") {
          delete params[key];
        }
      });

      const response = await getAdminRecommendors(params);
      setRecommendors(response.data || []);
      setTotal(response.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading recommendors:", error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendors();
  }, [pageSize, filters]);

  // Handle table change
  const handleTableChange = (pagination, filters, sorter) => {
    loadRecommendors(pagination.current);
  };

  // Search
  const handleSearch = () => {
    loadRecommendors(1);
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      name: "",
      gender: undefined,
      regionCode: undefined,
      status: undefined,
      minAge: undefined,
      maxAge: undefined,
    });
  };

  // Open create modal
  const handleCreate = () => {
    openModal("create");
  };

  // Open edit modal
  const handleEdit = (recommendor) => {
    openModal("edit", recommendor);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteRecommendor(id);
      message.success("删除成功");
      loadRecommendors(currentPage);
    } catch (error) {
      console.error("Error deleting recommendor:", error);
    }
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log("Form values:", values);
      console.log("Avatar URL:", avatarUrl);

      const data = {
        name: values.name,
        gender: values.gender,
        age: values.age,
        id_number: values.idNumber,
        avatar: avatarUrl || values.avatar,
        bio: values.bio,
        valid_from: values.validFrom ? values.validFrom.toISOString() : null,
        valid_until: values.validUntil ? values.validUntil.toISOString() : null,
        phone: values.phone,
        email: values.email,
        status: values.status || "active",
      };

      // Extract region codes if using RegionSelector
      if (values.region && values.region.codes) {
        data.province_code = values.region.codes[0];
        data.city_code = values.region.codes[1];
        data.district_code = values.region.codes[2];
        data.region_address = values.region.names;
      }

      console.log("Submitting data:", data);

      if (modalMode === "create") {
        await createRecommendor(data);
      } else {
        await updateRecommendor(editingRecommendor.id, data);
      }

      setModalVisible(false);
      form.resetFields();
      setAvatarUrl(null);
      loadRecommendors(currentPage);
    } catch (error) {
      console.error("Error saving recommendor:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    // Validate file
    if (!validateImageFile(file, 2)) {
      return false;
    }

    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarUrl(result.url);
      message.success("头像上传成功");
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error("Avatar upload error:", error);
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };

  // Open modal for create or edit
  const openModal = async (mode, recommendor = null) => {
    setModalMode(mode);
    setEditingRecommendor(recommendor);
    setAvatarUrl(null);

    if (mode === "edit" && recommendor) {
      try {
        // Load full recommendor details
        const detail = await getAdminRecommendorDetail(recommendor.id);

        // Build region info from backend fields
        const regionInfo = {
          codes: [detail.province_code, detail.city_code, detail.district_code],
          names: detail.region_address,
        };

        form.setFieldsValue({
          name: detail.name,
          gender: detail.gender,
          age: detail.age,
          idNumber: detail.id_number,
          avatar: detail.avatar,
          bio: detail.bio,
          validFrom: detail.valid_from ? dayjs(detail.valid_from) : null,
          validUntil: detail.valid_until ? dayjs(detail.valid_until) : null,
          phone: detail.phone,
          email: detail.email,
          region: regionInfo,
          status: detail.status,
          rating: detail.rating,
        });
      } catch (error) {
        console.error("Error loading recommendor detail:", error);
        message.error("加载推荐官详情失败");
        return;
      }
    } else {
      form.resetFields();
    }

    setModalVisible(true);
  };

  // Show QR codes
  const handleShowQR = async (recommendor) => {
    setQrDrawerVisible(true);
    setCurrentQRRecommendor(recommendor);
  };

  // Regenerate QR codes
  const handleRegenerateQR = async () => {
    if (!currentQRRecommendor) return;

    setQrLoading(true);
    try {
      await regenerateQRCodes(currentQRRecommendor.id);
      const updated = await getAdminRecommendorDetail(currentQRRecommendor.id);
      setCurrentQRRecommendor(updated);
      message.success("二维码重新生成成功");
    } catch (error) {
      console.error("Error regenerating QR codes:", error);
    } finally {
      setQrLoading(false);
    }
  };

  // Show detail
  const handleShowDetail = async (recommendor) => {
    setDetailDrawerVisible(true);
    setDetailLoading(true);

    try {
      const detail = await getAdminRecommendorDetail(recommendor.id);
      setDetailData(detail);
    } catch (error) {
      console.error("Error loading detail:", error);
      message.error("加载详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "头像",
      dataIndex: "avatar",
      key: "avatar",
      width: 80,
      render: (avatar, record) => (
        <Avatar
          src={avatar}
          size={40}
          icon={!avatar && <UserOutlined />}
          onClick={() => handleShowDetail(record)}
          style={{ cursor: "pointer" }}
        />
      ),
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "性别",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      render: (gender) => (
        <Tag
          color={
            gender === "male"
              ? "blue"
              : gender === "female"
                ? "pink"
                : "default"
          }
        >
          {gender === "male" ? "男" : gender === "female" ? "女" : "其他"}
        </Tag>
      ),
    },
    {
      title: "年龄",
      dataIndex: "age",
      key: "age",
      width: 80,
    },
    {
      title: "地区",
      dataIndex: "region_address",
      key: "region_address",
      width: 150,
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
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      render: (rating) => (
        <span style={{ color: "#faad14", fontWeight: "bold" }}>
          {rating?.toFixed(1) || "-"}
        </span>
      ),
    },
    {
      title: "有效期",
      key: "validPeriod",
      width: 180,
      render: (_, record) => (
        <span>
          {dayjs(record.validFrom).format("YYYY-MM-DD")}
          <br />至 {dayjs(record.validUntil).format("YYYY-MM-DD")}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 280,
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
            icon={<QrcodeOutlined />}
            onClick={() => handleShowQR(record)}
          >
            二维码
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal("edit", record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个推荐官吗？"
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
          <Form.Item label="姓名">
            <Input
              placeholder="请输入姓名"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              allowClear
              style={{ width: 150 }}
            />
          </Form.Item>

          <Form.Item label="性别">
            <Select
              placeholder="请选择性别"
              value={filters.gender}
              onChange={(value) => setFilters({ ...filters, gender: value })}
              allowClear
              style={{ width: 100 }}
            >
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
              <Select.Option value="other">其他</Select.Option>
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
              onChange={(value) => setFilters({ ...filters, status: value })}
              allowClear
              style={{ width: 120 }}
            >
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">非活跃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="年龄">
            <InputNumber
              placeholder="最小"
              min={18}
              max={100}
              value={filters.minAge}
              onChange={(value) => setFilters({ ...filters, minAge: value })}
              style={{ width: 80 }}
            />
            <span style={{ margin: "0 8px" }}>-</span>
            <InputNumber
              placeholder="最大"
              min={18}
              max={100}
              value={filters.maxAge}
              onChange={(value) => setFilters({ ...filters, maxAge: value })}
              style={{ width: 80 }}
            />
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
                添加推荐官
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={recommendors}
          rowKey="id"
          loading={tableLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: handleTableChange,
            onShowSizeChange: (current, size) => {
              setPageSize(size);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={modalMode === "create" ? "添加推荐官" : "编辑推荐官"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="性别"
            name="gender"
            rules={[{ required: true, message: "请选择性别" }]}
          >
            <Select placeholder="请选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="年龄"
            name="age"
            rules={[{ required: true, message: "请输入年龄" }]}
          >
            <InputNumber
              placeholder="请输入年龄"
              min={18}
              max={100}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="证件号"
            name="idNumber"
            rules={[{ required: true, message: "请输入证件号" }]}
          >
            <Input placeholder="请输入证件号" />
          </Form.Item>

          <Form.Item label="头像">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
            >
              {avatarUrl ||
              (modalMode === "edit" && editingRecommendor?.avatar) ? (
                <img
                  src={
                    avatarUrl ||
                    (modalMode === "edit" ? editingRecommendor?.avatar : "")
                  }
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div>
                  {avatarUploading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>
                    {avatarUploading ? "上传中" : "上传头像"}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item label="简介" name="bio">
            <TextArea
              placeholder="请输入简介"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="有效期" required>
            <Input.Group compact>
              <Form.Item
                name="validFrom"
                noStyle
                rules={[{ required: true, message: "请选择开始日期" }]}
              >
                <DatePicker style={{ width: "50%" }} placeholder="开始日期" />
              </Form.Item>
              <Form.Item
                name="validUntil"
                noStyle
                rules={[{ required: true, message: "请选择结束日期" }]}
              >
                <DatePicker style={{ width: "50%" }} placeholder="结束日期" />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item label="电话" name="phone">
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" type="email" />
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

          <Form.Item label="状态" name="status" initialValue="active">
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">非活跃</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="评分" name="rating" initialValue={0}>
            <InputNumber min={0} max={5} step={0.1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {modalMode === "create" ? "创建" : "更新"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* QR Code Drawer */}
      <Drawer
        title="推荐官二维码"
        placement="right"
        width={500}
        open={qrDrawerVisible}
        onClose={() => setQrDrawerVisible(false)}
      >
        {currentQRRecommendor && (
          <div>
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <Avatar
                src={currentQRRecommendor.avatar}
                size={80}
                style={{ marginBottom: 16 }}
              />
              <h3 style={{ marginTop: 8 }}>{currentQRRecommendor.name}</h3>
              <p style={{ color: "#8c8c8c" }}>
                {currentQRRecommendor.region?.name}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>网页二维码</h4>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Image
                  src={currentQRRecommendor.qr_code_web}
                  alt="网页二维码"
                  style={{ maxWidth: "100%" }}
                  fallback={
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="二维码加载失败"
                    />
                  }
                />
              </div>
              <p style={{ color: "#8c8c8c", textAlign: "center" }}>
                扫码跳转到网页详情页
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>小程序二维码</h4>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Image
                  src={currentQRRecommendor.qr_code_wxapp}
                  alt="小程序二维码"
                  style={{ maxWidth: "100%" }}
                  fallback={
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="二维码加载失败"
                    />
                  }
                />
              </div>
              <p style={{ color: "#8c8c8c", textAlign: "center" }}>
                扫码跳转到小程序详情页
              </p>
            </div>

            <Button
              type="primary"
              block
              icon={<ReloadOutlined />}
              loading={qrLoading}
              onClick={handleRegenerateQR}
            >
              重新生成二维码
            </Button>
          </div>
        )}
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="推荐官详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        loading={detailLoading}
      >
        {detailData && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Avatar
                src={detailData.avatar}
                size={100}
                style={{ marginBottom: 16 }}
              />
              <h2>{detailData.name}</h2>
              <Tag color={detailData.status === "active" ? "green" : "red"}>
                {detailData.status === "active" ? "活跃" : "非活跃"}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="证件号">
                {detailData.id_number}
              </Descriptions.Item>
              <Descriptions.Item label="性别">
                {detailData.gender === "male"
                  ? "男"
                  : detailData.gender === "female"
                    ? "女"
                    : "其他"}
              </Descriptions.Item>
              <Descriptions.Item label="年龄">
                {detailData.age} 岁
              </Descriptions.Item>
              <Descriptions.Item label="地区">
                {detailData.region_address}
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {detailData.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {detailData.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                <span style={{ color: "#faad14", fontWeight: "bold" }}>
                  {detailData.rating?.toFixed(1)} / 5.0
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="有效期">
                {dayjs(detailData.validFrom).format("YYYY-MM-DD")}
                <br />至 {dayjs(detailData.validUntil).format("YYYY-MM-DD")}
              </Descriptions.Item>
              <Descriptions.Item label="简介">
                {detailData.bio || "-"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default RecommendorManagement;
