// pages/recommendor/detail.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 推荐官 ID
    recommendorId: null,
    // 推荐官详情
    recommendor: null,
    // 推荐目的地列表
    destinations: [],
    // 是否正在加载
    loading: true,
    // 目的地加载状态
    destinationsLoading: false,
    // 目的地总数
    destinationsTotal: 0,
    // 目的地当前页
    destinationsPage: 1,
    // 目的地每页数量
    destinationsPageSize: 10,
    // 是否还有更多目的地
    destinationsHasMore: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("推荐官详情页加载", options);

    // 获取推荐官 ID
    if (options.id) {
      this.setData({ recommendorId: options.id });
      this.loadRecommendorDetail();
      this.loadDestinations();
    } else {
      wx.showToast({
        title: "参数错误",
        icon: "none",
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 设置导航栏标题
    if (this.data.recommendor) {
      wx.setNavigationBarTitle({
        title: this.data.recommendor.name || "推荐官详情",
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时可以刷新数据
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    Promise.all([this.loadRecommendorDetail(), this.loadDestinations()]).then(
      () => {
        wx.stopPullDownRefresh();
      },
    );
  },

  /**
   * 上拉加载更多目的地
   */
  onReachBottom() {
    if (!this.data.destinationsLoading && this.data.destinationsHasMore) {
      this.loadMoreDestinations();
    }
  },

  /**
   * 加载推荐官详情
   */
  loadRecommendorDetail(showLoading = true) {
    this.setData({ loading: true });

    return app
      .getPublicRecommendorDetail(this.data.recommendorId, { showLoading })
      .then((recommendor) => {
        // 计算推荐官星星状态
        const recommendorWithStars = {
          ...recommendor,
          stars: this.getStarsArray(recommendor.rating || 0),
        };
        recommendorWithStars.valid_from = recommendor.valid_from.split('T')[0]||"-";
        recommendorWithStars.valid_until = recommendor.valid_until.split('T')[0]||"-";
        recommendorWithStars.created_at = recommendor.created_at.split('T')[0]||"-";
        this.setData({
          recommendor: recommendorWithStars,
        });

        // 设置导航栏标题
        wx.setNavigationBarTitle({
          title: recommendor.name || "推荐官详情",
        });
      })
      .catch((error) => {
        console.error("加载推荐官详情失败:", error);
        wx.showToast({
          title: "加载失败",
          icon: "none",
        });
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 加载推荐的目的地列表
   */
  loadDestinations(showLoading = false) {
    if (this.data.destinationsLoading) return;

    this.setData({ destinationsLoading: true });

    const params = {
      page: 1,
      page_size: this.data.destinationsPageSize,
    };

    return app
      .getDestinationsByRecommendor(this.data.recommendorId, params, {
        showLoading,
      })
      .then((response) => {
        const destinations = response.data || [];
        const total = response.total || 0;
        const hasMore = destinations.length >= this.data.destinationsPageSize;

        // 为每个目的地计算星星状态
        const destinationsWithStars = destinations.map((item) => {
          return {
            ...item,
            stars: this.getStarsArray(item.rating || 0),
          };
        });

        this.setData({
          destinations: destinationsWithStars,
          destinationsTotal: total,
          destinationsHasMore: hasMore,
          destinationsPage: 1,
        });
      })
      .catch((error) => {
        console.error("加载目的地列表失败:", error);
      })
      .finally(() => {
        this.setData({ destinationsLoading: false });
      });
  },

  /**
   * 加载更多目的地
   */
  loadMoreDestinations() {
    if (this.data.destinationsLoading || !this.data.destinationsHasMore) return;

    const nextPage = this.data.destinationsPage + 1;

    this.setData({ destinationsLoading: true });

    const params = {
      page: nextPage,
      page_size: this.data.destinationsPageSize,
    };

    app
      .getDestinationsByRecommendor(this.data.recommendorId, params, {
        showLoading: false,
      })
      .then((response) => {
        const newDestinations = response.data || [];
        const hasMore =
          newDestinations.length >= this.data.destinationsPageSize;

        // 为新加载的目的地计算星星状态
        const destinationsWithStars = newDestinations.map((item) => {
          return {
            ...item,
            stars: this.getStarsArray(item.rating || 0),
          };
        });

        this.setData({
          destinations: [...this.data.destinations, ...destinationsWithStars],
          destinationsHasMore: hasMore,
          destinationsPage: nextPage,
        });
      })
      .catch((error) => {
        console.error("加载更多目的地失败:", error);
      })
      .finally(() => {
        this.setData({ destinationsLoading: false });
      });
  },

  /**
   * 获取星星数组
   * @param {number} rating - 评分
   * @returns {Array} 星星状态数组
   */
  getStarsArray(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push({ filled: true, half: false });
      } else if (rating >= i - 0.5) {
        stars.push({ filled: false, half: true });
      } else {
        stars.push({ filled: false, half: false });
      }
    }
    return stars;
  },

  /**
   * 返回列表
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 预览头像
   */
  onPreviewAvatar() {
    const avatar = this.data.recommendor?.avatar;
    if (!avatar) return;

    wx.previewImage({
      current: avatar,
      urls: [avatar],
    });
  },

  /**
   * 预览二维码
   */
  onPreviewQRCode(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;

    wx.previewImage({
      current: url,
      urls: [url],
    });
  },

  /**
   * 查看目的地详情
   */
  onViewDestination(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;

    // 如果需要跳转到目的地详情页，可以使用以下代码
    // 目前暂时只显示提示
    wx.showToast({
      title: "目的地详情功能开发中",
      icon: "none",
    });

    // 如果有目的地详情页，使用以下代码
    // wx.navigateTo({
    //   url: `/pages/destination/detail?id=${id}`
    // });
  },

  /**
   * 预览目的地图片
   */
  onPreviewDestinationImage(e) {
    const { url, images } = e.currentTarget.dataset;
    if (!url) return;

    wx.previewImage({
      current: url,
      urls: images || [url],
    });
  },

  /**
   * 复制电话号码
   */
  onCopyPhone() {
    const phone = this.data.recommendor?.phone;
    if (!phone) {
      wx.showToast({
        title: "暂无电话",
        icon: "none",
      });
      return;
    }

    wx.setClipboardData({
      data: phone,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success",
        });
      },
    });
  },

  /**
   * 复制邮箱
   */
  onCopyEmail() {
    const email = this.data.recommendor?.email;
    if (!email) {
      wx.showToast({
        title: "暂无邮箱",
        icon: "none",
      });
      return;
    }

    wx.setClipboardData({
      data: email,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success",
        });
      },
    });
  },

  /**
   * 保存二维码到相册
   */
  onSaveQRCode(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) {
      wx.showToast({
        title: "暂无二维码",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "保存中...",
      mask: true,
    });

    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: "已保存到相册",
                icon: "success",
              });
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({
                title: "保存失败",
                icon: "none",
              });
            },
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: "下载失败",
          icon: "none",
        });
      },
    });
  },
});
