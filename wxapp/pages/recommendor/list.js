// pages/recommendor/list.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 推荐官列表
    recommendors: [],
    // 总数
    total: 0,
    // 当前页
    currentPage: 1,
    // 每页数量
    pageSize: 12,
    // 是否正在加载
    loading: false,
    // 是否还有更多数据
    hasMore: true,

    // 筛选条件
    filters: {
      name: "",
      province: "", // 省份名称
      city: "", // 城市名称
      district: "", // 区县名称
      status: "active",
    },

    // 已选地区（微信地区选择器返回格式：["广东省", "广州市", "天河区"]）
    region: [],
    // 地区选择器显示文本
    regionText: "选择地区",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("推荐官列表页加载", options);
    this.loadRecommendors();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.setNavigationBarTitle({
      title: "旅游推荐官",
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新加载数据
    if (this.data.currentPage === 1) {
      this.loadRecommendors();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ currentPage: 1, hasMore: true }, () => {
      this.loadRecommendors().then(() => {
        wx.stopPullDownRefresh();
      });
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadMoreRecommendors();
    }
  },

  /**
   * 加载推荐官列表
   */
  loadRecommendors(showLoading = true) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    return new Promise((resolve, reject) => {
      const params = this.buildRequestParams();

      app
        .getPublicRecommendors(params, { showLoading })
        .then((response) => {
          const recommendors = response.data || [];
          const total = response.total || 0;
          const hasMore = recommendors.length >= this.data.pageSize;

          // 为每个推荐官计算星星状态
          const recommendorsWithStars = recommendors.map((item) => {
            return {
              ...item,
              stars: Array.from({ length: 5 }, (_, index) => {
                const starIndex = index + 1;
                const rating = item.rating || 0;
                return this.getStarStatus(starIndex, rating);
              }),
            };
          });

          this.setData({
            recommendors: recommendorsWithStars,
            total,
            hasMore,
          });
          resolve(response);
        })
        .catch((error) => {
          console.error("加载推荐官列表失败:", error);
          wx.showToast({
            title: "加载失败",
            icon: "none",
          });
          reject(error);
        })
        .finally(() => {
          this.setData({ loading: false });
        });
    });
  },

  /**
   * 加载更多推荐官
   */
  loadMoreRecommendors() {
    if (this.data.loading || !this.data.hasMore) return;

    const nextPage = this.data.currentPage + 1;

    this.setData({ loading: true });

    const params = this.buildRequestParams();
    params.page = nextPage;

    app
      .getPublicRecommendors(params, { showLoading: false })
      .then((response) => {
        const newRecommendors = response.data || [];
        const hasMore = newRecommendors.length >= this.data.pageSize;

        // 为新加载的推荐官计算星星状态
        const recommendorsWithStars = newRecommendors.map((item) => {
          return {
            ...item,
            stars: Array.from({ length: 5 }, (_, index) => {
              const starIndex = index + 1;
              const rating = item.rating || 0;
              return this.getStarStatus(starIndex, rating);
            }),
          };
        });

        this.setData({
          recommendors: [...this.data.recommendors, ...recommendorsWithStars],
          currentPage: nextPage,
          hasMore,
        });
      })
      .catch((error) => {
        console.error("加载更多推荐官失败:", error);
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 构建请求参数
   */
  buildRequestParams() {
    const params = {
      page: this.data.currentPage,
      page_size: this.data.pageSize,
      status: this.data.filters.status,
    };

    // 添加名称筛选
    if (this.data.filters.name && this.data.filters.name.trim()) {
      params.name = this.data.filters.name.trim();
    }

    // 添加地区筛选（使用地区名称）
    if (this.data.filters.province) {
      params.province = this.data.filters.province;
    }
    if (this.data.filters.city) {
      params.city = this.data.filters.city;
    }
    if (this.data.filters.district) {
      params.district = this.data.filters.district;
    }

    return params;
  },

  /**
   * 输入框输入事件
   */
  onNameInput(e) {
    this.setData({
      "filters.name": e.detail.value,
    });
  },

  /**
   * 地区选择器变化事件
   */
  onRegionChange(e) {
    const region = e.detail.value;
    const [province, city, district] = region;

    // 更新地区显示文本
    let regionText = "选择地区";
    if (province && province !== "省") {
      regionText = province;
      if (city && city !== "市") {
        regionText += " " + city;
        if (district && district !== "区" && district !== "县") {
          regionText += " " + district;
        }
      }
    }

    this.setData({
      region,
      "filters.province": province && province !== "省" ? province : "",
      "filters.city": city && city !== "市" ? city : "",
      "filters.district":
        district && district !== "区" && district !== "县" ? district : "",
      regionText,
    });

    // 重新加载列表
    this.setData({ currentPage: 1, hasMore: true }, () => {
      this.loadRecommendors();
    });
  },

  /**
   * 清除地区选择
   */
  clearRegion() {
    this.setData({
      region: [],
      "filters.province": "",
      "filters.city": "",
      "filters.district": "",
      regionText: "选择地区",
    });

    this.loadRecommendors();
  },

  /**
   * 搜索
   */
  onSearch() {
    this.setData({ currentPage: 1, hasMore: true }, () => {
      this.loadRecommendors();
    });
  },

  /**
   * 重置筛选
   */
  onReset() {
    this.setData(
      {
        filters: {
          name: "",
          province: "",
          city: "",
          district: "",
          status: "active",
        },
        region: [],
        regionText: "选择地区",
        currentPage: 1,
        hasMore: true,
      },
      () => {
        this.loadRecommendors();
      },
    );
  },

  /**
   * 查看推荐官详情
   */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/recommendor/detail?id=${id}`,
    });
  },

  /**
   * 预览头像
   */
  onPreviewAvatar(e) {
    const { url } = e.currentTarget.dataset;
    if (!url || url === "" || url === null) return;

    wx.previewImage({
      current: url,
      urls: [url],
    });
  },

  /**
   * 获取星星显示状态
   * @param {number} index - 星星位置 (1-5)
   * @param {number} rating - 评分
   * @returns {object} { filled: boolean, half: boolean }
   */
  getStarStatus(index, rating) {
    if (!rating || rating === 0) {
      return { filled: false, half: false };
    }

    if (rating >= index) {
      return { filled: true, half: false };
    } else if (rating >= index - 0.5) {
      return { filled: false, half: true };
    }

    return { filled: false, half: false };
  },
});
