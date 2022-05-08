let url_base = ``
const app = getApp();
let cloud = wx.cloud;
wx.cloud.init()

type Object = { [key: string]: any };
type ReqOpt = number;
type User = any;
type Msg = any;

let user: any;
let userGetTimeStamp: number | null = null;
let userUpdateTimeStamp: number | null = null;
var token = null;

interface initOptions {
  url: string
}

/**
 * @author 万劫不复ks WJBFks
 * @version 0.0.3
 */
var wj = {
  /**
   * 初始化函数
   * 
   * 必须在使用前初始化
   * 
   * 项目只需要初始化一次即可
   * 
   * 建议在app.js中完成
   * @param options 初始化参数
   * @example
   * ```
   * wj.init({
   *   url:`https://test.cn:9000`
   * })
   * ```
   */
  init(options: initOptions) {
    url_base = options.url;
  },
  /**
   * request请求可选参数
   * @param debug debug模式，不发送请求，以log输出请求参数
   * 
   * @param token token验证模式，发送请求将在header携带Bearer token
   * 
   */
  reqOpt: {
    /**
     * debug模式，不发送请求，以log输出请求参数
     */
    debug: 1,
    /**
     * token验证模式，发送请求将在header携带Bearer token
     */
    token: 2,
  },

  /**
   * token相关操作
   */
  token: function () {
    return {
      /**
       * 获取token
       */
      get() {
        if (token == null) {
          var t = wx.getStorageSync('token');
          if (t) {
            token = t;
            return token;
          } else {
            return null;
          }
        } else {
          return token;
        }
      },
      /**
       * 缓存token
       * @param t token
       */
      set(t) {
        token = t;
        wx.setStorageSync('token', t);
      },
      del(){
        token = null;
        wx.removeStorageSync('token')
      }
    }
  },
  /**
   * request请求，封装wx.request为Promise风格
   * @param api 请求接口，如 '/login'
   * @param options 可选参数（支持使用 '|' 进行连接）
   * @description options参数列表
   * 
   * `wj.reqOpt.debug` debug模式，不发送请求，以log输出请求参数
   * 
   * `wj.reqOpt.token` token验证模式，发送请求将在header携带Bearer token
   * 
   * @example 
   * ```
   * wj.request('/user', wj.reqOpt.debug | wj.reqOpt.token)
   *   .get().then(res=>{
   *     console.log(res)
   *   })
   * ```
   */
  request(api: string, options?: ReqOpt) {
    let that = this
    const request = (method: "GET" | "POST" | "PUT" | "OPTIONS" | "HEAD" | "DELETE" | "TRACE" | "CONNECT", data: any) => {
      return new Promise((resolve, reject) => {
        let header: Object = {
          'content-type': 'application/x-www-form-urlencoded',
        }
        let query = ""
        if (data != undefined && data != null && (method == 'GET' || method == 'DELETE')) {
          query = "?"
          let isFirst = true;
          for (let key in data) {
            if (!isFirst) {
              query += "&"
              isFirst = false;
            }
            query += key
            query += "="
            query += data[key]
          }
          data = {}
        }
        if (options != undefined) {
          if (options & this.reqOpt.token) {
            header['Authorization'] = 'Bearer ' + that.token().get();
          }
          if (options & this.reqOpt.debug) {
            var logDebug = {
              url: url_base + api + query,
              header,
              method,
              data: that._stringify(data),
            }
            resolve(logDebug)
            console.log(logDebug);
            return
          }
        }
        wx.request({
          url: url_base + api + query,
          header,
          method,
          data: that._stringify(data),
          timeout: 100000,
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
    }
    return {
      /**
       * 发送get请求
       */
      get(data?: any) {
        return request('GET', data);
      },
      /**
       * 发送post请求
       * @param data 参数
       */
      post(data: any) {
        return request('POST', data);
      },
      /**
       * 发送put请求
       * @param data 参数
       */
      put(data: any) {
        return request('PUT', data);
      },
      /**
       * 发送delete请求
       * @param data 参数
       */
      delete(data: any) {
        return request('DELETE', data);
      }
    }
  },

  /**
   * 用户信息
   * @param openid 留空表示当前登录用户
   * @tips 该接口需要配合对应云函数使用
   */
  user(openid?: string) {
    var that = this;
    var call = (operate: string, data?: Object, field?: Object) => {
      return cloud.callFunction({
        name: 'userDB',
        data: {
          openid,
          operate,
          data,
          field,
        }
      })
    }
    return {
      /**
       * 同步获取当前用户信息
       * 
       */
      mine() {
        if ((openid == undefined || (user != undefined && openid == user._id)) && userGetTimeStamp != null && (
          userUpdateTimeStamp == null ||
          userGetTimeStamp > userUpdateTimeStamp)) {
          userGetTimeStamp = that.timeStamp().get();
          return {
            err: null,
            user: user,
          };
        } else {
          return {
            err: Error('不是最新'),
            user: user,
          };
        }
      },
      /**
       * 获取用户信息
       * @param field 过滤（缺省表示不过滤）
       * @example
       * ```
       * let field = {
       *  _id: true,
       *  "userinfo.nickName": true,
       *  "userinfo.avatarUrl": true,
       * }
       * wj.user(openid).get(field)
       * ```
       */
      get(field?: Object): Promise<User> {
        return new Promise((resolve, reject) => {
          if ((openid == undefined || (user != undefined && openid == user._id)) && userGetTimeStamp != null && (
            userUpdateTimeStamp == null ||
            userGetTimeStamp > userUpdateTimeStamp)) {
            userGetTimeStamp = that.timeStamp().get();
            resolve(user);
          } else {
            call('get', undefined, field).then((res: { result: unknown; }) => {
              if (openid == undefined) {
                user = res.result
                userGetTimeStamp = that.timeStamp().get();
              }
              resolve(res.result)
            }).catch((err) => {
              reject(err)
            })
          }
        })
      },
      /**
       * 获取所有用户信息
       * @param field 过滤（缺省表示不过滤）
       * @example
       * ```
       * let field = {
       *  _id: true,
       *  "userinfo.nickName": true,
       *  "userinfo.avatarUrl": true,
       * }
       * wj.user().gets(field)
       * ```
       */
      gets(field?: Object): Promise<User> {
        return new Promise((resolve, reject) => {
          call('gets', undefined, field).then((res: { result: unknown; }) => {
            resolve(res.result)
          }).catch((err) => {
            reject(err)
          })
        })
      },
      /**
       * 添加/更新用户信息
       * @param data 用户信息
       * @description
       * 如果用户不存在，则`添加`用户信息
       * 
       * 如果用户已存在，则`更新`用户信息
       * @example
       * ```
       * wj.user().addup({
       *   userinfo: res.userInfo
       * })
       * ```
       */
      addup(data: Object): Promise<Msg> {
        return new Promise((resolve, reject) => {
          call('addup', data).then((res: any) => {
            if (openid == undefined || (user != undefined && openid == user._id)) {
              userUpdateTimeStamp = that.timeStamp().get();
            }
            resolve({
              meg: '添加/更新成功',
              res,
            })
          }).catch((err: any) => {
            reject(err)
          })
        })
      },
    }
  },

  /**
   * 获取时间戳
   * @param ts 时间戳函数或时间戳字符串
   * @description 根据ts获取时间戳，留空则获取当前时间戳
   */
  timeStamp(ts?: string | number) {
    let date: Date;
    if (ts) {
      date = new Date(ts)
    } else {
      date = new Date()
    }
    let timestamp = date.getTime()
    return {
      mongo2js() {
        timestamp *= 1000
        date = new Date(timestamp)
        return this
      },
      /**
       * JavaScript时间转MongoDB时间
       * @example
       * ```
       * timestamp('2022-04-21 20:34').js2mongo().get()
       * ```
       */
      js2mongo() {
        timestamp = Math.floor(timestamp /= 1000)
        date = new Date(timestamp)
        return this
      },
      /**
       * 获取时间戳
       */
      get() {
        return timestamp
      },
      /**
       * 获取日期字符串
       */
      date() {
        var Y = date.getFullYear();
        var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
        var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
        return Y + '-' + M + '-' + D
      },
      /**
       * 获取时间字符串
       * @param sec 是否显示秒
       * @description 
       * `sec==true`显示秒
       * 
       * `sec==false`或留空不显示
       */
      time(sec?: boolean) {
        var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
        var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        if (sec) {
          return h + ':' + m + ':' + s
        } else {
          return h + ':' + m
        }
      },
      /**
      * 获取完整时间字符串（日期和时间）
      * @param sec 是否显示秒
      * @description 
      * `sec==true`显示秒
      * 
      * `sec==false`或留空不显示
      */
      full(sec?: boolean) {
        return this.date() + ' ' + this.time(sec);
      }
    }
  },

  _stringify(obj: any) {
    if (obj == null || obj == undefined) {
      return
    }
    let s: Object = {}
    for (let [key, value] of Object.entries(obj)) {
      if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
        s[key] = value
      } else {
        s[key] = JSON.stringify(value)
      }
    }
    return s
  },
}

export default wj;