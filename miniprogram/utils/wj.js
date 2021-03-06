"use strict";
exports.__esModule = true;
var url_base = "";
var app = getApp();
var cloud = wx.cloud;
wx.cloud.init();
var user;
var userGetTimeStamp = null;
var userUpdateTimeStamp = null;
var token = null;
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
    init: function (options) {
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
        token: 2
    },
    /**
     * token相关操作
     */
    token: function () {
        return {
            /**
             * 获取token
             */
            get: function () {
                if (token == null) {
                    var t = wx.getStorageSync('token');
                    if (t) {
                        token = t;
                        return token;
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return token;
                }
            },
            /**
             * 缓存token
             * @param t token
             */
            set: function (t) {
                token = t;
                wx.setStorageSync('token', t);
            },
            del: function () {
                token = null;
                wx.removeStorageSync('token');
            }
        };
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
    request: function (api, options) {
        var _this = this;
        var that = this;
        var request = function (method, data) {
            return new Promise(function (resolve, reject) {
                var header = {
                    'content-type': 'application/x-www-form-urlencoded'
                };
                var query = "";
                if (data != undefined && data != null && (method == 'GET' || method == 'DELETE')) {
                    query = "?";
                    var isFirst = true;
                    for (var key in data) {
                        if (!isFirst) {
                            query += "&";
                            isFirst = false;
                        }
                        query += key;
                        query += "=";
                        query += data[key];
                    }
                    data = {};
                }
                if (options != undefined) {
                    if (options & _this.reqOpt.token) {
                        header['Authorization'] = 'Bearer ' + that.token().get();
                    }
                    if (options & _this.reqOpt.debug) {
                        var logDebug = {
                            url: url_base + api + query,
                            header: header,
                            method: method,
                            data: that._stringify(data)
                        };
                        resolve(logDebug);
                        console.log(logDebug);
                        return;
                    }
                }
                wx.request({
                    url: url_base + api + query,
                    header: header,
                    method: method,
                    data: that._stringify(data),
                    timeout: 100000,
                    success: function (res) {
                        resolve(res);
                    },
                    fail: function (err) {
                        reject(err);
                    }
                });
            });
        };
        return {
            /**
             * 发送get请求
             */
            get: function (data) {
                return request('GET', data);
            },
            /**
             * 发送post请求
             * @param data 参数
             */
            post: function (data) {
                return request('POST', data);
            },
            /**
             * 发送put请求
             * @param data 参数
             */
            put: function (data) {
                return request('PUT', data);
            },
            /**
             * 发送delete请求
             * @param data 参数
             */
            "delete": function (data) {
                return request('DELETE', data);
            }
        };
    },
    /**
     * 用户信息
     * @param openid 留空表示当前登录用户
     * @tips 该接口需要配合对应云函数使用
     */
    user: function (openid) {
        var that = this;
        var call = function (operate, data, field) {
            return cloud.callFunction({
                name: 'userDB',
                data: {
                    openid: openid,
                    operate: operate,
                    data: data,
                    field: field
                }
            });
        };
        return {
            /**
             * 同步获取当前用户信息
             *
             */
            mine: function () {
                if ((openid == undefined || (user != undefined && openid == user._id)) && userGetTimeStamp != null && (userUpdateTimeStamp == null ||
                    userGetTimeStamp > userUpdateTimeStamp)) {
                    userGetTimeStamp = that.timeStamp().get();
                    return {
                        err: null,
                        user: user
                    };
                }
                else {
                    return {
                        err: Error('不是最新'),
                        user: user
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
            get: function (field) {
                return new Promise(function (resolve, reject) {
                    if ((openid == undefined || (user != undefined && openid == user._id)) && userGetTimeStamp != null && (userUpdateTimeStamp == null ||
                        userGetTimeStamp > userUpdateTimeStamp)) {
                        userGetTimeStamp = that.timeStamp().get();
                        resolve(user);
                    }
                    else {
                        call('get', undefined, field).then(function (res) {
                            if (openid == undefined) {
                                user = res.result;
                                userGetTimeStamp = that.timeStamp().get();
                            }
                            resolve(res.result);
                        })["catch"](function (err) {
                            reject(err);
                        });
                    }
                });
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
            gets: function (field) {
                return new Promise(function (resolve, reject) {
                    call('gets', undefined, field).then(function (res) {
                        resolve(res.result);
                    })["catch"](function (err) {
                        reject(err);
                    });
                });
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
            addup: function (data) {
                return new Promise(function (resolve, reject) {
                    call('addup', data).then(function (res) {
                        if (openid == undefined || (user != undefined && openid == user._id)) {
                            userUpdateTimeStamp = that.timeStamp().get();
                        }
                        resolve({
                            meg: '添加/更新成功',
                            res: res
                        });
                    })["catch"](function (err) {
                        reject(err);
                    });
                });
            }
        };
    },
    /**
     * 获取时间戳
     * @param ts 时间戳函数或时间戳字符串
     * @description 根据ts获取时间戳，留空则获取当前时间戳
     */
    timeStamp: function (ts) {
        var date;
        if (ts) {
            date = new Date(ts);
        }
        else {
            date = new Date();
        }
        var timestamp = date.getTime();
        return {
            mongo2js: function () {
                timestamp *= 1000;
                date = new Date(timestamp);
                return this;
            },
            /**
             * JavaScript时间转MongoDB时间
             * @example
             * ```
             * timestamp('2022-04-21 20:34').js2mongo().get()
             * ```
             */
            js2mongo: function () {
                timestamp = Math.floor(timestamp /= 1000);
                date = new Date(timestamp);
                return this;
            },
            /**
             * 获取时间戳
             */
            get: function () {
                return timestamp;
            },
            /**
             * 获取日期字符串
             */
            date: function () {
                var Y = date.getFullYear();
                var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
                var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                return Y + '-' + M + '-' + D;
            },
            /**
             * 获取时间字符串
             * @param sec 是否显示秒
             * @description
             * `sec==true`显示秒
             *
             * `sec==false`或留空不显示
             */
            time: function (sec) {
                var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
                var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
                var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                if (sec) {
                    return h + ':' + m + ':' + s;
                }
                else {
                    return h + ':' + m;
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
            full: function (sec) {
                return this.date() + ' ' + this.time(sec);
            }
        };
    },
    _stringify: function (obj) {
        if (obj == null || obj == undefined) {
            return;
        }
        var s = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof value == "number" || typeof value == "boolean" || typeof value == "string") {
                s[key] = value;
            }
            else {
                s[key] = JSON.stringify(value);
            }
        }
        return s;
    }
};
exports["default"] = wj;
