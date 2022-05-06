import wj from "../../utils/wj"
const app = getApp();
Page({
  data: {
    nav: {
      navBarHeight: 0, // 导航栏高度
      menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
      menuBotton: 0, // 胶囊距底部间距（保持底部间距一致）
      menuHeight: 0, // 胶囊高度（自定义内容可与胶囊高度保证一致）
      navTop: 0,
      navDis: 0,
      menuWidth: 0,
    },
    formats: {},
    readOnly: false,
    placeholder: '开始输入...',
    editorHeight: 300,
    keyboardHeight: 0,
    isIOS: false,
    html: "",
    id: "",
    title: "",
    content: "",
  },

  onLoad: function (options) {
    this.calcNav();
    if (options.id) {
      this.setData({
        id: options.id
      })
    }
  },
  calcNav() {
    // 获取导航栏信息
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    //
    let nav = {};
    nav.navTop = systemInfo.statusBarHeight;
    // 导航栏间距 = （胶囊距上距离-状态栏高度）
    nav.navDis = (menuButtonInfo.top - systemInfo.statusBarHeight);
    // 导航栏高度 = 导航栏间距 * 2 + 胶囊高度 + 状态栏高度
    nav.navBarHeight = nav.navDis * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    nav.menuRight = systemInfo.screenWidth - menuButtonInfo.right;
    nav.menuBotton = menuButtonInfo.top - systemInfo.statusBarHeight;
    nav.menuHeight = menuButtonInfo.height;
    nav.menuWidth = menuButtonInfo.width;
    this.setData({
      nav,
    })
  },
  readOnlyChange() {
    this.setData({
      readOnly: !this.data.readOnly
    })
  },
  getdoc() {
    wj.request('/docs/' + this.data.id, wj.reqOpt.token).get().then(res => {
      this.setData({
        title: res.data.doc.title,
        content: res.data.content,
      })
      console.log("获取文档正在！");
      console.log(res);
      this.onEditorReady();
    })
  },
  onShow() {
    //this.getdoc();
    this.load();
  },
  load() {

    const platform = wx.getSystemInfoSync().platform
    const isIOS = platform === 'ios'
    this.setData({
      isIOS
    })
    const that = this
    this.updatePosition(0)
    let keyboardHeight = 0
    wx.onKeyboardHeightChange(res => {
      if (res.height === keyboardHeight) return
      const duration = res.height > 0 ? res.duration * 1000 : 0
      keyboardHeight = res.height
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 0,
          success() {
            that.updatePosition(keyboardHeight)
            that.editorCtx.scrollIntoView()
          }
        })
      }, duration)
    })
  },
  onInput(e) {
    this.setData({
      html: e.detail.html,
    })
  },
  updatePosition(keyboardHeight) {
    const toolbarHeight = 50
    const {
      windowHeight,
      platform
    } = wx.getSystemInfoSync()
    let editorHeight = keyboardHeight > 0 ? (windowHeight - keyboardHeight - toolbarHeight) : windowHeight
    this.setData({
      editorHeight,
      keyboardHeight
    })
  },
  calNavigationBarAndStatusBar() {
    const systemInfo = wx.getSystemInfoSync()
    const {
      statusBarHeight,
      platform
    } = systemInfo
    const isIOS = platform === 'ios'
    const navigationBarHeight = isIOS ? 44 : 48
    return statusBarHeight + navigationBarHeight
  },
  onEditorReady() {
    const that = this
    wx.createSelectorQuery().select('#editor').context(function (res) {
      that.editorCtx = res.context
      that.editorCtx.setContents({
        html: that.data.content
      })
    }).exec()
  },
  blur() {
    this.editorCtx.blur()
  },
  format(e) {
    let {
      name,
      value
    } = e.target.dataset
    if (!name) return
    // console.log('format', name, value)
    this.editorCtx.format(name, value)

  },
  onStatusChange(e) {
    const formats = e.detail
    this.setData({
      formats
    })
  },
  insertDivider() {
    this.editorCtx.insertDivider({
      success: function () {
        console.log('insert divider success')
      }
    })
  },

  removeFormat() {
    this.editorCtx.removeFormat()
  },
  insertDate() {
    const date = new Date()
    const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    this.editorCtx.insertText({
      text: formatDate
    })
  },
  insertImage() {
    const that = this
    wx.chooseImage({
      count: 1,
      success: function (res) {
        that.editorCtx.insertImage({
          src: res.tempFilePaths[0],
          data: {
            id: 'abcd',
            role: 'god'
          },
          width: '80%',
          success: function () {
            console.log('insert image success')
          }
        })
      }
    })
  },
  inputTitle(e) {
    console.log(e);
    this.setData({
      title: e.detail.value
    })
  },
  submit: function () {
    let title = this.data.title;
    if (title == undefined || title == null || title.length == 0) {
      wx.showToast({
        title: '标题不能为空',
        icon: "error",
        duration: 500,
      })
      return;
    }
    wx.showModal({
      title: "保存内容",
      content: "是否要保存修改内容",
      confirmText: "保存",
      cancelText: "不保存",
    }).then(res => {
      if (res.confirm) {
        return wj.request('/docs/' + this.data.id, wj.reqOpt.token).put({
          title,
          content: this.data.html
        })
      } else {
        throw '取消'
      }
    }).then(res => {
      wx.showToast({
        title: '保存成功',
        icon: "success",
        duration: 500,
      })
    }).catch(err => {
      if (err != '取消')
        console.log(err);
    })
  },
  navBack() {
    wx.navigateBack({
      delta: 0,
    })
  },
  reset: function () {
    wx.showModal({
      title: "清空文档",
      content: "是否要清空文档内容",
      confirmText: "清空",
      cancelText: "不清空",
    }).then(res => {
      if (res.confirm) {
        return this.clear()
      } else {
        throw '取消'
      }
    }).then(res => {
      wx.showToast({
        title: '已清空',
        icon: "success",
        duration: 500,
      })
    }).catch(err => {
      if (err != '取消')
        console.log(err);
    })
  },
  clear() {
    return new Promise((resolve, reject) => {
      this.editorCtx.clear({
        success: function (res) {
          resolve("clear success")
        },
        fail: function (err) {
          reject(err)
        },
      })
    })

  },
})