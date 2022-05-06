import wj from "./utils/wj"
wj.init({
  url: `http://121.4.174.222:9000`,
})
wx.cloud.init({
  env: 'cloud1-7gpvjj0f0a22157a',
});
App({
  globalData: {
    situation: 0,
    /**
     * 0 未登录
     * 1 微信登录失败
     * 2 已进行微信登录
     * 3 已进行微信登录，但绑定失败
     * 4 绑定成功
     */
  },

  onLaunch() {
    this.login()
  },

  async login(){
    let user
    try{
      user = await wj.user().get();
    }catch (err){
      this.globalData.situation = 1
      return
    }
    this.globalData.situation = 2
    wj.request('/users/token', wj.reqOpt.token).get()
    .then((res) => {
      if (res.statusCode == 401) {
        this.globalData.situation = 3
        throw res
      }
      let prevOpenid = user._id;
      let curOpenid = res.data.user.openid;
      if (prevOpenid === curOpenid) {
        this.globalData.situation = 4
      } else {
        this.globalData.situation = 3
      }
    }).catch(err => {
      console.error(err)
    })
  }
})