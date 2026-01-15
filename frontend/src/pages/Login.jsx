import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '@services/auth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);

      if (result.success) {
        message.success('登录成功');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginWrapper}>
        <Card style={styles.loginCard}>
          <div style={styles.header}>
            <SafetyCertificateOutlined style={styles.logoIcon} />
            <div>
              <div style={styles.title}>旅游推荐官管理系统</div>
              <div style={styles.subtitle}>Tourism Recommender Management System</div>
            </div>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            initialValues={{ remember: true }}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div style={styles.rememberForgot}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={styles.loginButton}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={styles.footer}>
            <div style={styles.copyright}>
              © 2024 旅游推荐官管理系统. All rights reserved.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loginWrapper: {
    width: '100%',
    maxWidth: '400px',
  },
  loginCard: {
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: 'none',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    padding: '20px 0',
  },
  logoIcon: {
    fontSize: '48px',
    color: '#1890ff',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#8c8c8c',
  },
  rememberForgot: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loginButton: {
    height: '44px',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
  },
  footer: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
    textAlign: 'center',
  },
  copyright: {
    fontSize: '12px',
    color: '#8c8c8c',
  },
};

export default Login;
