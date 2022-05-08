// pages/gdoc/gdoc.js
import wj from "../../utils/wj"
const avatarUrls = {};
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    situation: 0,
    cdid: "",
    title: "",
    docarr: [],
    moreIndex: null,
    moreShow: false,
    shareIndex: null,
    shareShow: false,
    user: null,
    shares: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {},
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    wj.user().get().then(res => {
      this.setData({
        user: res,
      })
      return this.load()
    }, err => {
      return this.load()
    }).catch(err => {
      console.log(err);
    })
  },
  onPullDownRefresh() {
    this.load()
      .then(res => {
        return wx.stopPullDownRefresh()
      })
      .then(res => {
        wx.showToast({
          title: '刷新完成',
          icon: "success",
          duration: 1000,
          mask: false,
        })
      });
  },
  getdoc() {
    return new Promise((resolve, reject) => {
      wj.request('/docs', wj.reqOpt.token).get({
          limit: 99999
        }).then(res => {
          let docarr = res.data.docs;
          return wj.request('/docs/share', wj.reqOpt.token).get({
            limit: 99999
          }).then(res => {
            docarr.push(...res.data.docs)
            return docarr
          })
        })
        .then(res => {
          console.log(res)
          let docarr = res;
          if (docarr == null || docarr == undefined) {
            this.setData({
              docarr: [],
            })
            resolve('done')
            return
          }
          docarr.sort(this.compare('last', false));
          //console.log("新的");
          //console.log(docarr);
          for (let i = 0; i < docarr.length; i++) {
            docarr[i].created = wj.timeStamp(docarr[i].created).mongo2js().full()
            docarr[i].last = wj.timeStamp(docarr[i].last).mongo2js().full()
          }
          this.setData({
            docarr,
          })
          resolve('done')
        })
    })

  },
  bindItem: function (event) {
    //console.log(event.currentTarget.dataset.id)
    wx.navigateTo({
      url: '../editor/editor?id=' + event.currentTarget.dataset.id
    })
  },
  delete: function (event) {
    let id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除文档",
      content: "是否您要删除此文档?"
    }).then(res => {
      if (res.confirm) {
        return wj.request("/docs/" + id, wj.reqOpt.token).delete()
      } else {
        throw '取消'
      }
    }).then(res => {
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 500,
      })
      this.setData({
        moreShow: false,
      })
      this.onShow();
    }).catch(err => {
      if (err != '取消') {
        console.error(err);
      }
    })
  },
  rename: function (event) {
    let id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "重命名文档",
      editable: true,
      placeholderText: "请输入新标题",
      confirmText: "重命名",
    }).then(res => {
      if (res.confirm) {
        return wj.request('/docs/' + id, wj.reqOpt.token).put({
          title: res.content,
        })
      } else {
        throw '取消'
      }
    }).then(res => {
      wx.showToast({
        title: '重命名成功',
        icon: 'success',
        duration: 500,
      })
      this.setData({
        moreShow: false,
      })
      this.onShow();
    }).catch(err => {
      if (err != '取消') {
        console.error(err);
      }
    })
  },
  share: function (event) {
    let docarr = this.data.docarr
    let index;
    if (event == undefined) {
      index = this.data.shareIndex
    } else {
      index = event.currentTarget.dataset.index;
    }
    this.setData({
      shareIndex: index,
      shareShow: true,
    })
    wj.request('/docs/share/' + docarr[index]._id, wj.reqOpt.token).get().then(res => {
      console.log(res);
      this.setData({
        shares: res.data.users,
      })
    })
  },
  hideShare() {
    this.setData({
      shareShow: false,
    })
  },
  shareAdd(e) {
    let docarr = this.data.docarr
    let index = this.data.shareIndex
    let tel = e.detail.value.tel;
    wx.showToast({
      title: '添加中',
      icon: 'loading',
      mask: true,
    })
    wj.request('/docs/share/' + docarr[index]._id, wj.reqOpt.token).put({
      tel,
    }).then(res => {
      console.log(res);
      if (res.statusCode != 200) {
        throw res
      }
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 500,
      })
      this.share()
    }).catch(err => {
      console.log(err);
      wx.showToast({
        title: err.data.msg,
        icon: 'error',
        duration: 500,
      })
    })
  },
  shareDel(e) {
    let user = e.currentTarget.dataset.user;
    let docarr = this.data.docarr
    let index = this.data.shareIndex
    wx.showModal({
      title: "移除共享",
      content: "确定要移除该用户的文档共享权限吗"
    }).then(res => {
      if (res.confirm) {
        wx.showToast({
          title: '移除中',
          icon: 'loading',
          mask: true,
        })
        wj.request('/docs/share/' + docarr[index]._id, wj.reqOpt.token).delete({
          tel: user.tel,
        }).then(res => {
          console.log(res);
          if (res.statusCode != 200) {
            throw res
          }
          wx.showToast({
            title: '移除成功',
            icon: 'success',
            duration: 500,
          })
          this.share()
        }).catch(err => {
          console.log(err);
          wx.showToast({
            title: err.data.msg,
            icon: 'error',
            duration: 500,
          })
        })
      } else {
        throw "取消"
      }
    }).catch(err => {
      if (err != '取消') {
        console.error(err);
        wx.showToast({
          title: '移除失败',
          icon: 'error',
          duration: 500,
        })
      }
    })

  },
  compare: function (key, desc) {
    //key:  用于排序的数组的key值
    //desc： 布尔值，为true是升序排序，false是降序排序
    return function (a, b) {
      let value1 = a[key];
      let value2 = b[key];
      if (desc == true) {
        // 升序排列
        return value1 - value2;
      } else {
        // 降序排列
        return value2 - value1;
      }
    };
  },
  async load() {
    return new Promise((resolve, reject) => {
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
              reject(1)
              break;
            case 3: // 已进行微信登录，但绑定失败
              wj.user().get().then(res => {
                console.log(res);
                this.setData({
                  situation: app.globalData.situation,
                  cdid: res.cdid
                })
              })
              reject(2)
              break;
            case 4:
              wj.user().get().then(res => {
                console.log(res);
                this.setData({
                  situation: app.globalData.situation,
                  cdid: res.cdid,
                })
                this.getdoc().then(res => {
                    return this.getCreatorsInfo()
                  }).then(res => {
                    resolve(4)
                  })
                  .catch(res => {
                    console.error(res);
                  })
              })
              break;
          }
        }, 500);
      }
      getSit();
    })
  },
  createdoc: function () {
    let docId = null;
    wx.showModal({
      title: "新建文档",
      editable: true,
      placeholderText: "请输入标题",
      confirmText: "确认新建",
      cancelText: "取消新建",
    }).then(res => {
      if (res.confirm) {
        this.setData({
          title: res.content
        })
        if (res.content == undefined || res.content == "" || res.content.length == 0) {
          throw Error('标题不能为空')
        }
        return wj.request("/docs", wj.reqOpt.token).post({
          title: res.content,
        })
      } else {
        throw Error('取消')
      }
    }).then(res => {
      docId = res.data.doc._id
      this.onShow();
      return wx.showModal({
        title: "文档创建完成",
        content: "文档创建完成，是否立即进入文档进行编辑",
        confirmText: "进入文档",
        cancelText: "不进入",
      })
    }).then(res => {
      console.log(res);
      if (res.confirm) {
        wx.navigateTo({
          url: '../editor/editor?id=' + docId,
        })
      } else {
        throw Error('取消')
      }
    }).catch(err => {
      if (err.message != '取消') {
        wx.showToast({
          title: err.message,
          icon: 'error',
          duration: 1000,
        })
      }
    })
  },
  toLogin() {
    wx.switchTab({
      url: '/pages/mine/home/home',
    })
  },
  toBind() {
    wx.navigateTo({
      url: '/pages/mine/bind/bind?state=bind'
    })
  },
  showMore(e) {
    this.setData({
      moreShow: true,
      moreIndex: e.currentTarget.dataset.index,
    })
  },
  hideMore() {
    this.setData({
      moreShow: false,
    })
  },
  async getCreatorsInfo() {
    let docarr = this.data.docarr
    for (let i in docarr) {
      let openid = docarr[i].openid
      if (openid == undefined) {
        continue;
      }
      if (avatarUrls[openid] === undefined) {
        await wj.user(openid).get().then(res => {
          avatarUrls[openid] = res.userInfo.avatarUrl
        }, err => {
          avatarUrls[openid] = null
        })
      }
      docarr[i].avatarUrl = avatarUrls[openid]
    }
    this.setData({
      docarr,
    })
  },
})