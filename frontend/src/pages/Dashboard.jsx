import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { getAdminRecommendors, getAdminDestinations } from "@services/api";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRecommendors: 0,
    activeRecommendors: 0,
    totalDestinations: 0,
    activeDestinations: 0,
    averageRating: 0,
  });
  const [recentRecommendors, setRecentRecommendors] = useState([]);
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  // Load statistics
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [recommendorsRes, destinationsRes] = await Promise.all([
        getAdminRecommendors({ page: 1, page_size: 1000 }),
        getAdminDestinations({ page: 1, page_size: 1000 }),
      ]);

      const recommendors = recommendorsRes.data || [];
      const destinations = destinationsRes.data || [];

      const activeRecommendors = recommendors.filter(
        (r) => r.status === "active",
      );
      const activeDestinations = destinations.filter(
        (d) => d.status === "active",
      );
      const totalRating = recommendors.reduce(
        (sum, r) => sum + (r.rating || 0),
        0,
      );
      const avgRating =
        recommendors.length > 0 ? totalRating / recommendors.length : 0;

      setStats({
        totalRecommendors: recommendors.length,
        activeRecommendors: activeRecommendors.length,
        totalDestinations: destinations.length,
        activeDestinations: activeDestinations.length,
        averageRating: avgRating.toFixed(1),
      });

      // Get recent items (last 5)
      setRecentRecommendors(
        recommendors.slice(0, 5).map((r) => ({
          ...r,
          createdAt: r.created_at || new Date().toISOString(),
        })),
      );
      setRecentDestinations(
        destinations.slice(0, 5).map((d) => ({
          ...d,
          createdAt: d.created_at || new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const recommendorColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "性别",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      render: (gender) =>
        gender === "male" ? "男" : gender === "female" ? "女" : "其他",
    },
    {
      title: "地区",
      dataIndex: "region_address",
      key: "region_address",
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
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const destinationColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "推荐官",
      dataIndex: ["recommendor", "name"],
      key: "recommendor",
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => {
        const categoryMap = {
          scenic_spot: "景点",
          food: "美食",
          accommodation: "住宿",
        };
        return categoryMap[category] || category;
      },
    },
    {
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      render: (rating) => (
        <Space>
          <StarOutlined style={{ color: "#faad14" }} />
          <span>{rating?.toFixed(1) || "-"}</span>
        </Space>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="总推荐官"
                value={stats.totalRecommendors}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
                suffix={
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#8c8c8c",
                      marginLeft: "8px",
                    }}
                  >
                    人
                  </span>
                }
              />
              <div
                style={{
                  marginTop: "12px",
                  color: "#52c41a",
                  fontSize: "12px",
                }}
              >
                <ArrowUpOutlined />
                <span style={{ marginLeft: "4px" }}>
                  活跃: {stats.activeRecommendors}
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="总目的地"
                value={stats.totalDestinations}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: "#52c41a" }}
                suffix={
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#8c8c8c",
                      marginLeft: "8px",
                    }}
                  >
                    个
                  </span>
                }
              />
              <div
                style={{
                  marginTop: "12px",
                  color: "#52c41a",
                  fontSize: "12px",
                }}
              >
                <ArrowUpOutlined />
                <span style={{ marginLeft: "4px" }}>
                  活跃: {stats.activeDestinations}
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="平均评分"
                value={stats.averageRating}
                precision={1}
                prefix={<StarOutlined />}
                valueStyle={{ color: "#faad14" }}
                suffix="/ 5.0"
              />
              <div
                style={{
                  marginTop: "12px",
                  color: "#8c8c8c",
                  fontSize: "12px",
                }}
              >
                <ClockCircleOutlined />
                <span style={{ marginLeft: "4px" }}>所有推荐官平均评分</span>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="活跃率"
                value={
                  stats.totalRecommendors > 0
                    ? (
                        (stats.activeRecommendors / stats.totalRecommendors) *
                        100
                      ).toFixed(1)
                    : 0
                }
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: "#722ed1" }}
                suffix="%"
              />
              <div
                style={{
                  marginTop: "12px",
                  color: "#8c8c8c",
                  fontSize: "12px",
                }}
              >
                <span>推荐官活跃比例</span>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title="最新推荐官"
            loading={loading}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => (window.location.href = "/admin/recommendors")}
              >
                查看全部
              </Button>
            }
          >
            <Table
              columns={recommendorColumns}
              dataSource={recentRecommendors}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="最新目的地"
            loading={loading}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => (window.location.href = "/admin/destinations")}
              >
                查看全部
              </Button>
            }
          >
            <Table
              columns={destinationColumns}
              dataSource={recentDestinations}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
