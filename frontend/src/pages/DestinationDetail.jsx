import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Tag,
  Rate,
  Descriptions,
  Button,
  Spin,
  Empty,
  Image,
  Space,
  Divider,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  getPublicDestinationDetail,
  getPublicDestinations,
} from "@services/api";

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(null);
  const [similarDestinations, setSimilarDestinations] = useState([]);

  // Load destination detail
  const loadDestinationDetail = async () => {
    setLoading(true);
    try {
      const data = await getPublicDestinationDetail(id);
      setDestination(data);
    } catch (error) {
      console.error("Error loading destination detail:", error);
      message.error("加载目的地详情失败");
      navigate("/recommendors");
    } finally {
      setLoading(false);
    }
  };

  // Load similar destinations
  const loadSimilarDestinations = async () => {
    try {
      const response = await getPublicDestinations({
        regionCode: destination?.region?.provinceCode,
        pageSize: 4,
        status: "active",
      });
      setSimilarDestinations(response.data?.filter((d) => d.id !== id) || []);
    } catch (error) {
      console.error("Error loading similar destinations:", error);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      loadDestinationDetail();
    }
  }, [id]);

  // Load similar destinations after destination data is loaded
  useEffect(() => {
    if (destination) {
      loadSimilarDestinations();
    }
  }, [destination]);

  // Navigate to recommendor detail
  const handleViewRecommendor = () => {
    if (destination?.recommendor?.id) {
      navigate(`/recommendors/${destination.recommendor.id}`);
    }
  };

  // Navigate to similar destination detail
  const handleViewDestination = (destinationId) => {
    navigate(`/destinations/${destinationId}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!destination) {
    return <Empty description="目的地不存在" style={{ padding: "100px 0" }} />;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 24 }}
      >
        返回
      </Button>

      {/* Header Card with Image */}
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Image
              src={destination.image}
              alt={destination.name}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
              fallback={
                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f0f0f0",
                    borderRadius: "8px",
                  }}
                >
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无图片"
                  />
                </div>
              }
            />
          </Col>

          <Col xs={24} md={12}>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%", flex: 1 }}
              >
                <div>
                  <h1 style={{ fontSize: "32px", marginBottom: 12 }}>
                    {destination.name}
                  </h1>
                  <Space wrap size="middle">
                    <Rate
                      disabled
                      defaultValue={destination.rating || 0}
                      allowHalf
                      style={{ fontSize: "20px" }}
                    />
                    <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                      {destination.rating?.toFixed(1) || "0.0"}
                    </span>
                    <Tag
                      color={destination.status === "active" ? "green" : "red"}
                    >
                      {destination.status === "active" ? "推荐中" : "暂停推荐"}
                    </Tag>
                  </Space>
                </div>

                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="推荐官">
                    <Space>
                      <UserOutlined />
                      <Button
                        type="link"
                        onClick={handleViewRecommendor}
                        style={{ padding: 0, marginLeft: 4 }}
                      >
                        {destination.recommendor?.name || "-"}
                      </Button>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="地区">
                    <Space>
                      <EnvironmentOutlined />
                      {destination.region?.name || "-"}
                    </Space>
                  </Descriptions.Item>
                  {destination.address && (
                    <Descriptions.Item label="详细地址">
                      {destination.address}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="发布时间">
                    <Space>
                      <CalendarOutlined />
                      {new Date(destination.createdAt).toLocaleDateString()}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                {destination.tags && destination.tags.length > 0 && (
                  <div>
                    <div
                      style={{
                        marginBottom: 8,
                        fontSize: "14px",
                        color: "#8c8c8c",
                      }}
                    >
                      标签：
                    </div>
                    <Space wrap size="small">
                      {destination.tags.map((tag) => (
                        <Tag key={tag} icon={<StarOutlined />}>
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Description Card */}
      <Card title="目的地介绍" style={{ marginBottom: 24 }}>
        <div
          style={{
            lineHeight: "1.8",
            fontSize: "15px",
            color: "#262626",
            whiteSpace: "pre-wrap",
            width: "100%",
            textWrap: "wrap",
            wordBreak: "break-all",

            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {destination.description || "暂无介绍"}
        </div>
      </Card>

      {/* Recommendor Card */}
      {destination.recommendor && (
        <Card title="推荐官信息" style={{ marginBottom: 24 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6} style={{ textAlign: "center" }}>
              <Image
                src={destination.recommendor.avatar}
                alt={destination.recommendor.name}
                width={100}
                height={100}
                style={{ borderRadius: "50%", objectFit: "cover" }}
                fallback={
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f0f0f0",
                    }}
                  >
                    <UserOutlined style={{ fontSize: "48px" }} />
                  </div>
                }
              />
            </Col>
            <Col xs={24} sm={18}>
              <h3 style={{ marginBottom: 8, fontSize: "20px" }}>
                {destination.recommendor.name}
              </h3>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div>
                  <EnvironmentOutlined />{" "}
                  {destination.recommendor.region_address || "未知地区"}
                </div>
                <div>
                  <Rate
                    disabled
                    defaultValue={destination.recommendor.rating || 0}
                    allowHalf
                    style={{ fontSize: "14px" }}
                  />{" "}
                  <span style={{ marginLeft: 8 }}>
                    {destination.recommendor.rating?.toFixed(1) || "0.0"} 分
                  </span>
                </div>
                {destination.recommendor.bio && (
                  <div style={{ color: "#595959", lineHeight: "1.6" }}>
                    {destination.recommendor.bio}
                  </div>
                )}
              </Space>
            </Col>
            <Col xs={24} style={{ textAlign: "center" }}>
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={handleViewRecommendor}
              >
                查看推荐官详情
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Similar Destinations Card */}
      {similarDestinations.length > 0 && (
        <Card title="相似推荐">
          <Row gutter={[24, 24]}>
            {similarDestinations.map((item) => (
              <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        height={160}
                        preview={false}
                      />
                    ) : (
                      <div
                        style={{
                          height: 160,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f0f0f0",
                        }}
                      >
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description=""
                        />
                      </div>
                    )
                  }
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDestination(item.id)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={item.name}
                    description={
                      <div>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            height: "40px",
                          }}
                        >
                          {item.description}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Rate
                            disabled
                            defaultValue={item.rating || 0}
                            allowHalf
                            style={{ fontSize: "12px" }}
                          />
                          <span style={{ marginLeft: 8, fontSize: "12px" }}>
                            {item.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            {item.tags.slice(0, 2).map((tag) => (
                              <Tag key={tag} size="small">
                                {tag}
                              </Tag>
                            ))}
                            {item.tags.length > 2 && (
                              <Tag size="small">+{item.tags.length - 2}</Tag>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Contact Info Card */}
      <Card title="联系方式" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="推荐官电话">
            {destination.recommendor?.phone ? (
              <Space>
                <PhoneOutlined />
                {destination.recommendor.phone}
              </Space>
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="推荐官邮箱">
            {destination.recommendor?.email ? (
              <Space>
                <MailOutlined />
                {destination.recommendor.email}
              </Space>
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="详细地址" span={2}>
            {destination.address || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default DestinationDetail;
