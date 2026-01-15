// app.js
App({
  globalData: {
    // API基础配置
    apiBaseUrl: 'https://your-api-domain.com/api',
    // 用户信息
    userInfo: null,
    // 位置信息
    location: null,
    // 系统信息
    systemInfo: null
  },

  onLaunch() {
    console.log('小程序启动');

    // 获取系统信息
    this.getSystemInfo();

    // 检查登录状态
    this.checkLoginStatus();

    // 获取用户位置
    this.getUserLocation();

    // 监听网络状态变化
    this.monitorNetworkStatus();
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  onError(msg) {
    console.error('小程序错误:', msg);
    wx.showToast({
      title: '程序出现错误',
      icon: 'none'
    });
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;

      // 设置状态栏高度和导航栏高度
      const { statusBarHeight, platform } = systemInfo;
      const isIOS = platform === 'ios';

      this.globalData.statusBarHeight = statusBarHeight;
      this.globalData.navBarHeight = isIOS ? 44 : 48;

    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    } else {
      // 没有登录，跳转到登录页面
      this.login();
    }
  },

  // 登录
  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 调用后端接口登录
            this.request('/auth/login', {
              method: 'POST',
              data: {
                code: res.code
              },
              success: (data) => {
                // 保存token和用户信息
                wx.setStorageSync('token', data.token);
                wx.setStorageSync('userInfo', data.userInfo);

                this.globalData.token = data.token;
                this.globalData.userInfo = data.userInfo;

                resolve(data);
              },
              fail: (error) => {
                console.error('登录失败:', error);
                reject(error);
              }
            });
          } else {
            console.error('获取用户登录态失败:', res.errMsg);
            reject(res.errMsg);
          }
        },
        fail: (error) => {
          console.error('wx.login 失败:', error);
          reject(error);
        }
      });
    });
  },

  // 获取用户位置
  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.location = {
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          altitude: res.altitude,
          speed: res.speed
        };
      },
      fail: (error) => {
        console.log('获取位置失败:', error);
        wx.showModal({
          title: '提示',
          content: '需要获取您的位置信息以提供更好的服务',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },

  // 监听网络状态
  monitorNetworkStatus() {
    // 获取当前网络状态
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkType = res.networkType;
      }
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.globalData.networkType = res.networkType;
      this.globalData.isConnected = res.isConnected;

      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      } else {
        if (this.globalData.networkType === 'wifi') {
          wx.showToast({
            title: '已切换到WiFi',
            icon: 'none',
            duration: 1000
          });
        }
      }
    });
  },

  // 封装网络请求
  request(url, options = {}) {
    const { method = 'GET', data = {}, success, fail, complete, showLoading = true, showToast = true } = options;

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : this.globalData.apiBaseUrl + url;

    // 构建请求头
    const header = {
      'content-type': 'application/json',
      ...options.header
    };

    // 添加token
    if (this.globalData.token) {
      header['Authorization'] = `Bearer ${this.globalData.token}`;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method,
        data,
        header,
        success: (res) => {
          if (showLoading) {
            wx.hideLoading();
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (success) {
              success(res.data);
            }
            resolve(res.data);
          } else {
            const errorMsg = res.data.error || res.data.message || '请求失败';

            if (showToast) {
              wx.showToast({
                title: errorMsg,
                icon: 'none'
              });
            }

            // 401 未授权，重新登录
            if (res.statusCode === 401) {
              this.logout();
            }

            if (fail) {
              fail(res.data);
            }
            reject(res.data);
          }
        },
        fail: (error) => {
          if (showLoading) {
            wx.hideLoading();
          }

          const errorMsg = '网络请求失败';

          if (showToast) {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }

          if (fail) {
            fail(error);
          }
          reject(error);
        },
        complete: () => {
          if (complete) {
            complete();
          }
        }
      });
    });
  },

  // 上传文件
  uploadFile(url, filePath, options = {}) {
    const { name = 'file', formData = {}, success, fail, complete, showLoading = true } = options;

    if (showLoading) {
      wx.showLoading({
        title: '上传中...',
        mask: true
      });
    }

    const fullUrl = url.startsWith('http') ? url : this.globalData.apiBaseUrl + url;

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: fullUrl,
        filePath,
        name,
        formData,
        header: {
          'Authorization': `Bearer ${this.globalData.token}`
        },
        success: (res) => {
          if (showLoading) {
            wx.hideLoading();
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(res.data);
            if (success) {
              success(data);
            }
            resolve(data);
          } else {
            const data = JSON.parse(res.data);
            const errorMsg = data.error || data.message || '上传失败';

            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });

            if (fail) {
              fail(data);
            }
            reject(data);
          }
        },
        fail: (error) => {
          if (showLoading) {
            wx.hideLoading();
          }

          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });

          if (fail) {
            fail(error);
          }
          reject(error);
        },
        complete: () => {
          if (complete) {
            complete();
          }
        }
      });
    });
  },

  // 退出登录
  logout() {
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');

    // 清除全局数据
    this.globalData.token = null;
    this.globalData.userInfo = null;

    // 跳转到登录页或首页
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 获取推荐官列表
  getRecommendors(params = {}) {
    return this.request('/recommendors', {
      method: 'GET',
      data: {
        page: 1,
        page_size: 10,
        sort_by: 'rating',
        sort_order: 'desc',
        ...params
      }
    });
  },

  // 获取推荐官详情
  getRecommendorDetail(id) {
    return this.request(`/recommendors/${id}`, {
      method: 'GET'
    });
  },

  // 获取目的地列表
  getDestinations(params = {}) {
    return this.request('/destinations', {
      method: 'GET',
      data: {
        page: 1,
        page_size: 10,
        ...params
      }
    });
  },

  // 获取目的地详情
  getDestinationDetail(id) {
    return this.request(`/destinations/${id}`, {
      method: 'GET'
    });
  },

  // 搜索
  search(keyword, type = 'all') {
    return this.request('/search', {
      method: 'GET',
      data: {
        keyword,
        type
      }
    });
  },

  // 收藏推荐官
  favoriteRecommendor(id) {
    return this.request(`/recommendors/${id}/favorite`, {
      method: 'POST'
    });
  },

  // 取消收藏推荐官
  unfavoriteRecommendor(id) {
    return this.request(`/recommendors/${id}/favorite`, {
      method: 'DELETE'
    });
  },

  // 收藏目的地
  favoriteDestination(id) {
    return this.request(`/destinations/${id}/favorite`, {
      method: 'POST'
    });
  },

  // 取消收藏目的地
  unfavoriteDestination(id) {
    return this.request(`/destinations/${id}/favorite`, {
      method: 'DELETE'
    });
  },

  // 获取我的收藏
  getMyFavorites() {
    return this.request('/user/favorites', {
      method: 'GET'
    });
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 计算距离
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（千米）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return (distance * 1000).toFixed(0) + 'm';
    } else {
      return distance.toFixed(1) + 'km';
    }
  },

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
});
