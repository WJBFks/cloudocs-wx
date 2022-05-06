import wj from "../../../utils/wj"

const app = getApp();

Page({
  data: {
    userInfo: null,
    tel: "",
    keyword: "",
    situation: 0,
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onLoad: function () {
    wj.user().get().then(res => {
      this.setData({
        userInfo: res.userInfo,
      })
    }).catch(err => {})
  },
  onShow() {
    this.load();
  },

  load() {
    const getSit = () => {
      setTimeout(() => {
        console.log(app.globalData.situation);
        switch (app.globalData.situation) {
          case 0:
          case 2:
            getSit();
            break;
          case 1:
            this.setData({
              situation: app.globalData.situation
            })
            break;
          case 3: // 已进行微信登录，但绑定失败
            wj.user().get().then(res => {
              console.log(res);
              this.setData({
                situation: app.globalData.situation,
                userInfo: res.userInfo,
              })
            })
            break;
          case 4:
            wj.user().get().then(res => {
              console.log(res);
              this.setData({
                situation: app.globalData.situation,
                userInfo: res.userInfo,
              })
            })
            break;
        }
      }, 500);
    }
    getSit();
  },
  toBind: function () {
    wx.navigateTo({
      url: '../bind/bind?state=bind'
    })
  },

  getUserProfile(e) {
    wx.getUserProfile({
        desc: '用于登录', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      })
      .then(res => {
        wx.setStorageSync("userInfo", res.userInfo)
        app.globalData.situation = 3
        this.setData({
          situation: 3,
          userInfo: res.userInfo
        })
        wj.user().addup({
          userInfo: res.userInfo
        })
      })
      .catch(err => {
        app.globalData.situation = 1
      })
  },
  // 巩钊旭
  CopyLink(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.link,
      success: res => {
        wx.showToast({
          title: '已复制链接',
          duration: 1200,
        })
      }
    })
  },
})