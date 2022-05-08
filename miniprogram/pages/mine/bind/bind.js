import wj from "../../../utils/wj";

// pages/regist.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    state: 'login',
    array: ['男', '女', '其他'],
    value: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.state) {
      this.setData({
        state: options.state
      })
    }
  },
  myret: function () {
    wx.navigateBack({
      delta: 0,
    })
  },


  bindPickerChange: function (e) {
    this.setData({
      value: e.detail.value
    })
  },
  register: function (data) {
    var p = /^(?=.*\d)(?=.*[a-zA-Z]).{6,12}$/

    if (!p.test(data.detail.value.userPwd)) {
      //提示一个错误，你的密码输入不符合规则
      console.log("提示一个错误，你的密码输入不符合规则")
      wx.showModal({
        title: '错误',
        content: '你的密码输入不符合规则',
      })
      return;
    }
    if (data.detail.value.userPwd != data.detail.value.userPwd1) {
      //提示一个错误，你的密码两次输入不一致
      console.log("提示一个错误，你的密码两次输入不一致")
      wx.showModal({
        title: '错误',
        content: '你的密码两次输入不一致',
      })
      return;
    }

    let gender = parseInt(this.data.value) + 1
    wj.request("/users", wj.reqOpt.token).post({
      tel: data.detail.value.phone,
      pass: data.detail.value.userPwd,
      name: data.detail.value.userName,
      email: data.detail.value.email,
      gender: gender,
    }).then(res => {
      if (res.statusCode != 201) throw res
      return wj.request("/bind", wj.reqOpt.token).put({
        tel: data.detail.value.phone,
        pass: data.detail.value.userPwd
      })
    }).then(res => {
      wx.navigateBack({
        delta: 0,
      })
      app.globalData.situation = 4
      console.log("后台自动成功绑定！");
    }).catch(err => {
      wx.showModal({
        title: '错误',
        content: String(err.data.msg),
      })
    })
  },
  toRegister() {
    this.setData({
      state: 'register',
    })
  },
  toBind() {
    this.setData({
      state: 'bind',
    })
  },

  // 登录
  async bind(e){
    let tel = e.detail.value.tel;
    let pass = e.detail.value.pass;
    let user = await wj.user().get()
    wj.request("/bind", wj.reqOpt.token).put({
      openid: user._id,
      tel,
      pass,
    }).then(res => {
      if (res.statusCode != 200) throw res
      wj.token().set(res.data.token)
      return wj.user().addup({
        tel,
        cdid:res.data.user._id,
      })
    }).then(res => {
      app.globalData.situation = 4
      wx.navigateBack({
        delta: 0,
      })
    }).catch(err => {
      console.error(err);
      wx.showModal({
        title: '错误',
        content: String(err.data.msg),
      })
    })
  }
})