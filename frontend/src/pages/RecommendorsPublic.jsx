import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Pagination,
  Spin,
  Empty,
  Tag,
  Rate,
  Avatar,
  Space,
  message,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  UserOutlined,
  RightOutlined,
} from "@ant-design/icons";
import RegionSelector from "@components/RegionSelector";
import { getPublicRecommendors } from "@services/api";

const RecommendorsPublic = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommendors, setRecommendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    regionCode: undefined,
    status: "active",
    minRating: undefined,
  });
  // Load recommendors
  const loadRecommendors = async (page = 1) => {
    setLoading(true);
    try {
      // Build request params from filters
      const params = {
        page,
        page_size: pageSize,
      };

      // Add name filter if provided
      if (filters.name && filters.name.trim()) {
        params.name = filters.name.trim();
      }

      // Add region filters from regionCode object
      if (filters.regionCode && filters.regionCode.codes) {
        params.province_code = filters.regionCode.codes[0];
        params.city_code = filters.regionCode.codes[1];
        params.district_code = filters.regionCode.codes[2];
      }

      // Add rating filter
      if (filters.minRating) {
        params.rating_gte = filters.minRating;
      }

      const response = await getPublicRecommendors(params);
      setRecommendors(response.data || []);
      setTotal(response.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading recommendors:", error);
      message.error("加载推荐官列表失败");
    } finally {
      setLoading(false);
    }
  };
  // Initial load
  useEffect(() => {
    loadRecommendors();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // Search
  const handleSearch = () => {
    loadRecommendors(1);
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      name: "",
      regionCode: undefined,
      status: "active",
      minRating: undefined,
    });
    loadRecommendors(1);
  };

  // Navigate to detail
  const handleViewDetail = (id) => {
    navigate(`/recommendors/${id}`);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: "36px", marginBottom: 8 }}>旅游推荐官</h1>
        <p style={{ color: "#8c8c8c", fontSize: "16px" }}>
          发现专业的旅游推荐官，开启您的完美旅程
        </p>
      </div>

      {/* Filter Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索推荐官姓名"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              prefix={<UserOutlined />}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RegionSelector
              placeholder="选择地区"
              value={filters.regionCode}
              onChange={(value) => handleFilterChange("regionCode", value)}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="最低评分"
              value={filters.minRating}
              onChange={(value) => handleFilterChange("minRating", value)}
              style={{ width: "100%" }}
              allowClear
            >
              <Select.Option value={4.5}>4.5分及以上</Select.Option>
              <Select.Option value={4}>4.0分及以上</Select.Option>
              <Select.Option value={3.5}>3.5分及以上</Select.Option>
              <Select.Option value={3}>3.0分及以上</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Space style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Recommendors Grid */}
          {recommendors.length > 0 ? (
            <>
              <Row gutter={[24, 24]}>
                {recommendors.map((recommendor) => (
                  <Col
                    key={recommendor.id}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={6}
                  >
                    <Card
                      hoverable
                      onClick={() => handleViewDetail(recommendor.id)}
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      cover={
                        <div
                          style={{
                            height: "200px",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f0f0f0",
                          }}
                        >
                          <Avatar
                            src={recommendor.avatar}
                            size={120}
                            icon={<UserOutlined />}
                          />
                        </div>
                      }
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: "18px",
                          }}
                        >
                          {recommendor.name}
                        </h3>

                        <Space
                          direction="vertical"
                          size="small"
                          style={{ width: "100%" }}
                        >
                          <div>
                            <EnvironmentOutlined />{" "}
                            {recommendor.region_address || "-"}
                          </div>

                          <div>
                            <Rate
                              disabled
                              defaultValue={recommendor.rating || 0}
                              allowHalf
                              style={{ fontSize: "14px" }}
                            />
                            <span
                              style={{
                                marginLeft: 8,
                                color: "#8c8c8c",
                                fontSize: "14px",
                              }}
                            >
                              {recommendor.rating?.toFixed(1) || "0.0"}
                            </span>
                          </div>

                          {recommendor.bio && (
                            <div
                              style={{
                                color: "#8c8c8c",
                                fontSize: "14px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                height: "40px",
                              }}
                            >
                              {recommendor.bio}
                            </div>
                          )}

                          <div>
                            <Tag color="green">
                              {recommendor.status === "active"
                                ? "活跃"
                                : "非活跃"}
                            </Tag>
                          </div>
                        </Space>
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "1px solid #f0f0f0",
                          textAlign: "center",
                        }}
                      >
                        <Button
                          type="link"
                          icon={<RightOutlined />}
                          style={{ padding: 0 }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              <div style={{ marginTop: 32, textAlign: "center" }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 位推荐官`}
                  pageSizeOptions={[12, 24, 36, 48]}
                  onChange={(page, pageSize) => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                    loadRecommendors(page);
                  }}
                />
              </div>
            </>
          ) : (
            <Empty description="暂无推荐官" style={{ padding: "100px 0" }} />
          )}
        </>
      )}
    </div>
  );
};

export default RecommendorsPublic;
