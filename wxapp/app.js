// app.js
App({
  globalData: {
    // API基础配置 - 需要替换为实际的 API 地址
    apiBaseUrl: "https://tourism-recommender-api.onrender.com/api",
    // 系统信息
    systemInfo: null,
  },

  onLaunch(options) {
    console.log("小程序启动", options); 

    // 获取系统信息
    this.getSystemInfo();

    // 处理启动参数（二维码扫码等）
    this.handleLaunchOptions(options);
  },

  onShow(options) {
    console.log("小程序显示", options);
  },

  onHide() {
    console.log("小程序隐藏");
  },

  onError(msg) {
    console.error("小程序错误:", msg);
    wx.showToast({
      title: "程序出现错误",
      icon: "none",
    });
  },

  // 处理启动参数
  handleLaunchOptions(options) {
    // 检查是否有推荐官详情页的参数
    // 二维码链接格式：/pages/recommendor/detail?id={id}
    const { scene, query, path } = options;

    let recommendorId = null;

    // 从 query 中获取 id（扫码直接打开详情页）
    if (query && query.id) {
      recommendorId = query.id;
    }

    // 如果有推荐官 ID，跳转到详情页
    if (recommendorId) {
      wx.redirectTo({
        url: `/pages/recommendor/detail?id=${recommendorId}`,
      });
    }
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;

      // 设置状态栏高度和导航栏高度
      const { statusBarHeight, platform } = systemInfo;
      const isIOS = platform === "ios";

      this.globalData.statusBarHeight = statusBarHeight;
      this.globalData.navBarHeight = isIOS ? 44 : 48;
    } catch (error) {
      console.error("获取系统信息失败:", error);
    }
  },

  // 封装网络请求
  request(url, options = {}) {
    const {
      method = "GET",
      data = {},
      success,
      fail,
      complete,
      showLoading = true,
      showToast = true,
    } = options;

    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: "加载中...",
        mask: true,
      });
    }

    // 构建完整URL
    const fullUrl = url.startsWith("http")
      ? url
      : this.globalData.apiBaseUrl + url;

    // 构建请求头
    const header = {
      "content-type": "application/json",
      ...options.header,
    };

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
            const errorMsg = res.data.error || res.data.message || "请求失败";

            if (showToast) {
              wx.showToast({
                title: errorMsg,
                icon: "none",
              });
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

          const errorMsg = "网络请求失败";

          if (showToast) {
            wx.showToast({
              title: errorMsg,
              icon: "none",
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
        },
      });
    });
  },

  // 获取推荐官列表（公开接口）
  getPublicRecommendors(params = {}) {
    return this.request("/recommendors", {
      method: "GET",
      data: {
        page: 1,
        page_size: 12,
        status: "active",
        ...params,
      },
    });
  },

  // 获取推荐官详情（公开接口）
  getPublicRecommendorDetail(id) {
    return this.request(`/recommendors/${id}`, {
      method: "GET",
    });
  },

  // 获取推荐官推荐的目的地（公开接口）
  getDestinationsByRecommendor(recommendorId, params = {}) {
    return this.request(`/recommendors/${recommendorId}/destinations`, {
      method: "GET",
      data: {
        page: 1,
        page_size: 10,
        ...params,
      },
    });
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  },
});
