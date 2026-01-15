import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Avatar,
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
  Tabs,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  QrcodeOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getPublicRecommendorDetail,
  getDestinationsByRecommendor,
} from "@services/api";
// DestinationCard component is not needed as we render cards directly

const RecommendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendor, setRecommendor] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);

  // Load recommendor detail
  const loadRecommendorDetail = async () => {
    setLoading(true);
    try {
      const data = await getPublicRecommendorDetail(id);
      setRecommendor(data);
    } catch (error) {
      console.error("Error loading recommendor detail:", error);
      message.error("加载推荐官详情失败");
      navigate("/recommendors");
    } finally {
      setLoading(false);
    }
  };

  // Load destinations for this recommendor
  const loadDestinations = async () => {
    setDestinationsLoading(true);
    try {
      const response = await getDestinationsByRecommendor(id, { pageSize: 10 });
      setDestinations(response.data || []);
    } catch (error) {
      console.error("Error loading destinations:", error);
    } finally {
      setDestinationsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (id) {
      loadRecommendorDetail();
      loadDestinations();
    }
  }, [id]);

  // Navigate to destination detail
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

  if (!recommendor) {
    return <Empty description="推荐官不存在" style={{ padding: "100px 0" }} />;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/recommendors")}
        style={{ marginBottom: 24 }}
      >
        返回列表
      </Button>

      {/* Header Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Avatar
              src={recommendor.avatar}
              size={150}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Rate
              disabled
              defaultValue={recommendor.rating || 0}
              allowHalf
              style={{ fontSize: "20px" }}
            />
            <div style={{ marginTop: 8, fontSize: "24px", fontWeight: "bold" }}>
              {recommendor.rating?.toFixed(1) || "0.0"}
            </div>
          </Col>

          <Col xs={24} md={16}>
            <h1 style={{ fontSize: "32px", marginBottom: 16 }}>
              {recommendor.name}
            </h1>

            <Space wrap size="large" style={{ marginBottom: 16 }}>
              <Tag
                color={recommendor.status === "active" ? "green" : "red"}
                style={{ fontSize: "14px", padding: "4px 12px" }}
              >
                {recommendor.status === "active" ? "活跃中" : "非活跃"}
              </Tag>
            </Space>

            {recommendor.bio && (
              <div style={{ marginTop: 16 }}>
                <h3>简介</h3>
                <p
                  style={{
                    color: "#595959",
                    lineHeight: "1.8",
                    fontSize: "15px",
                  }}
                >
                  {recommendor.bio}
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Info Card */}
      <Card title="详细信息" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="姓名">{recommendor.name}</Descriptions.Item>
          <Descriptions.Item label="性别">
            {recommendor.gender === "male"
              ? "男"
              : recommendor.gender === "female"
                ? "女"
                : "其他"}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">
            {recommendor.age} 岁
          </Descriptions.Item>
          <Descriptions.Item label="证件号">
            {recommendor.id_number}
          </Descriptions.Item>
          <Descriptions.Item label="电话">
            <Space>
              <PhoneOutlined />
              {recommendor.phone || "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            <Space>
              <MailOutlined />
              {recommendor.email || "-"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="地区">
            {recommendor.region_address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="评分">
            <Rate disabled defaultValue={recommendor.rating || 0} allowHalf />{" "}
            {recommendor.rating?.toFixed(1) || "0.0"} / 5.0
          </Descriptions.Item>
          <Descriptions.Item label="有效期">
            {new Date(recommendor.valid_from).toLocaleDateString()} 至{" "}
            {new Date(recommendor.valid_until).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {new Date(recommendor.created_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* QR Codes Card */}
      <Card title="扫码联系" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <QrcodeOutlined style={{ fontSize: "24px", marginRight: 8 }} />
              网页二维码
            </div>
            {recommendor.qr_code_web ? (
              <Image
                src={recommendor.qr_code_web}
                alt="网页二维码"
                width={200}
                height={200}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Empty description="暂无二维码" />
            )}
            <p style={{ marginTop: 8, color: "#8c8c8c" }}>
              扫码跳转到网页详情页
            </p>
          </Col>

          <Col xs={24} sm={12} style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <QrcodeOutlined style={{ fontSize: "24px", marginRight: 8 }} />
              小程序二维码
            </div>
            {recommendor.qr_code_wxapp ? (
              <Image
                src={recommendor.qr_code_wxapp}
                alt="小程序二维码"
                width={200}
                height={200}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Empty description="暂无二维码" />
            )}
            <p style={{ marginTop: 8, color: "#8c8c8c" }}>
              扫码跳转到小程序详情页
            </p>
          </Col>
        </Row>
      </Card>

      {/* Destinations Card */}
      <Card title="推荐目的地">
        {destinationsLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin />
          </div>
        ) : destinations.length > 0 ? (
          <Row gutter={[24, 24]}>
            {destinations.map((destination) => (
              <Col key={destination.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    destination.image ? (
                      <Image
                        src={destination.image}
                        alt={destination.name}
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
                      onClick={() => handleViewDestination(destination.id)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={destination.name}
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
                          {destination.description}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Rate
                            disabled
                            defaultValue={destination.rating || 0}
                            allowHalf
                            style={{ fontSize: "12px" }}
                          />
                          <span style={{ marginLeft: 8, fontSize: "12px" }}>
                            {destination.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        {destination.tags && destination.tags.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            {destination.tags.slice(0, 2).map((tag) => (
                              <Tag key={tag} size="small">
                                {tag}
                              </Tag>
                            ))}
                            {destination.tags.length > 2 && (
                              <Tag size="small">
                                +{destination.tags.length - 2}
                              </Tag>
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
        ) : (
          <Empty description="暂无推荐的目的地" />
        )}
      </Card>
    </div>
  );
};

export default RecommendorDetail;
