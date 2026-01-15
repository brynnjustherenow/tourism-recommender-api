// pages/index/index.js
const app = getApp();

Page({
  data: {
    // 轮播图数据
    banners: [
      {
        id: 1,
        image: '/images/banner1.jpg',
        title: '发现美景'
      },
      {
        id: 2,
        image: '/images/banner2.jpg',
        title: '推荐官'
      },
      {
        id: 3,
        image: '/images/banner3.jpg',
        title: '热门目的地'
      }
    ],

    // 分类数据
    categories: [
      {
        id: 1,
        name: '景点',
        icon: '/images/category/scenic.png'
      },
      {
        id: 2,
        name: '美食',
        icon: '/images/category/food.png'
      },
      {
        id: 3,
        name: '住宿',
        icon: '/images/category/hotel.png'
      },
      {
        id: 4,
        name: '购物',
        icon: '/images/category/shopping.png'
      }
    ],

    // 推荐官列表
    recommendors: [],

    // 目的地列表
    destinations: [],

    // 分页参数
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 加载状态
    loading: false,

    // 筛选参数
    filterParams: {}
  },

  onLoad(options) {
    console.log('首页加载', options);

    // 如果有参数，设置筛选条件
    if (options.category) {
      this.setData({
        filterParams: {
          category: options.category
        }
      });
    }

    // 加载数据
    this.loadData();
  },

  onShow() {
    console.log('首页显示');
  },

  onReady() {
    console.log('首页渲染完成');
  },

  onHide() {
    console.log('首页隐藏');
  },

  onUnload() {
    console.log('首页卸载');
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '旅游推荐官 - 发现最美的风景',
      path: '/pages/index/index',
      imageUrl: '/images/share.jpg'
    };
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });

    try {
      // 并行加载推荐官和目的地
      const [recommendorData, destinationData] = await Promise.all([
        this.loadRecommendors(),
        this.loadDestinations()
      ]);

      this.setData({
        recommendors: recommendorData.data || [],
        destinations: destinationData.data || [],
        total: destinationData.total || 0,
        hasMore: destinationData.total > this.data.pageSize,
        loading: false
      });

      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载推荐官
  loadRecommendors() {
    return app.getRecommendors({
      page: 1,
      page_size: 5,
      sort_by: 'rating',
      sort_order: 'desc',
      ...this.data.filterParams
    });
  },

  // 加载目的地
  loadDestinations() {
    return app.getDestinations({
      page: this.data.page,
      page_size: this.data.pageSize,
      sort_by: 'rating',
      sort_order: 'desc',
      ...this.data.filterParams
    });
  },

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadData();
  },

  // 加载更多
  loadMore() {
    this.setData({
      page: this.data.page + 1,
      loading: true
    });

    app.getDestinations({
      page: this.data.page,
      page_size: this.data.pageSize,
      ...this.data.filterParams
    }).then(res => {
      const newDestinations = res.data || [];
      const destinations = this.data.destinations.concat(newDestinations);

      this.setData({
        destinations,
        total: res.total || 0,
        hasMore: res.total > destinations.length,
        loading: false
      });

      wx.stopPullDownRefresh();
    }).catch(error => {
      console.error('加载更多失败:', error);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 点击搜索栏
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 点击轮播图
  onBannerTap(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击轮播图', id);
    // 可以根据id跳转到详情页
  },

  // 点击分类
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const categories = this.data.categories;
    const category = categories.find(c => c.id === id);

    wx.navigateTo({
      url: `/pages/search/search?category=${category.name}`
    });
  },

  // 点击推荐官
  onRecommendorTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recommendor/detail?id=${id}`
    });
  },

  // 点击目的地
  onDestinationTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/destination/detail?id=${id}`
    });
  },

  // 查看更多推荐官
  onMoreRecommendors() {
    wx.navigateTo({
      url: `/pages/search/search?type=recommendor`
    });
  },

  // 查看更多目的地
  onMoreDestinations() {
    wx.navigateTo({
      url: `/pages/search/search?type=destination`
    });
  },

  // 获取第一张图片
  getFirstImage(images) {
    if (!images || images === '[]') {
      return '/images/default-destination.png';
    }
    try {
      const imageArray = JSON.parse(images);
      return imageArray.length > 0 ? imageArray[0] : '/images/default-destination.png';
    } catch (error) {
      return '/images/default-destination.png';
    }
  },

  // 获取分类名称
  getCategoryName(category) {
    const categoryMap = {
      'scenic_spot': '景点',
      'food': '美食',
      'accommodation': '住宿',
      'shopping': '购物'
    };
    return categoryMap[category] || category;
  }
});
