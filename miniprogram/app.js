const config = require('./config')
const util = require('/utils/util.js');
const dbHelp = require('/utils/dbHelp.js')
const QQMapWX = require('/libs/qqmap-wx-jssdk.js');
var qqmapsdk = new QQMapWX({
        key: config.mapKey
});
App({
        onLaunch(opts) {
                var self = this;
                console.log('App Launch', opts)
                // wx.setEnableDebug({
                //         enableDebug: true
                // })
                if (!wx.cloud) {
                        console.error('请使用 2.2.3 或以上的基础库以使用云能力')
                } else {
                        wx.cloud.init({
                                env: config.envId,
                                traceUser: true,
                        })
                }
                this.getLocalCache();
                // 登录
                wx.login({
                        success: res => {
                                // 发送 res.code 到后台换取 openId, sessionKey, unionId
                        }
                })
                // 获取用户信息
                wx.getSetting({
                        success: res => {
                                if (res.authSetting['scope.userInfo']) {
                                        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                                        wx.getUserInfo({
                                                success: res => {
                                                        // 可以将 res 发送给后台解码出 unionId
                                                        this.globalData.userInfo = res.userInfo
                                                        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                                                        // 所以此处加入 callback 以防止这种情况
                                                        if (this.userInfoReadyCallback) {
                                                                this.userInfoReadyCallback(res)
                                                        }
                                                }
                                        })
                                }
                        }
                })
        },
        onShow(opts) {
                console.log('App Show', opts)
        },
        onHide() {
                console.log('App Hide')
        },
        globalData: {
                isStart: false,
                userInfo: null,
                address: null,
                openid: null,
                currentLocation: null,
                addressArr: [],
                currentLatitude: 0,
                currentLongitude: 0,
        },
        checkUpdateLocation: function (res) {
                var self = this;
                //var myTimeSlotUTC = self.data.myIntervalSize * Math.floor(Date.now() / self.data.myIntervalSize)
                var myTimeSlotUTC = Date.now() //Using database at last. I decide to use exact time finally and not to eschew two more calls of if clause
                //Get user location
                // 计算是否移动超过10米，如果超过则进行上报
                var dis_list = util.getDistanceWithType(self.globalData.currentLatitude, self.globalData.currentLongitude, res.latitude, res.longitude)
                if (dis_list[0] > 10) {
                        // 开始上报数据
                        self.globalData.currentLatitude = res.latitude
                        self.globalData.currentLongitude = res.longitude
                        qqmapsdk.reverseGeocoder({
                                location: { latitude: self.globalData.currentLatitude, longitude: self.globalData.currentLongitude },
                                //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
                                success: function (res) {//成功后的回调
                                        self.globalData.currentLocation = res.result;
                                        dbHelp.yiQingSubmit(res.result.location.lat, res.result.location.lng, res.result.address, dis_list, myTimeSlotUTC)
                                }
                        })
                }
        },
        doUpdateLocation() {
                var self = this;
                const _locationChangeFn = function (res) {
                        console.log('location change', res)
                }
                wx.startLocationUpdateBackground({
                        success: res => {
                                console.log('开启后台定位', res)
                                wx.onLocationChange(res => {
                                        console.log('location change', res)
                                        self.checkUpdateLocation(res);
                                })
                                wx.offLocationChange(res => {
                                        console.log('location off', res)
                                })
                        },
                        fail: res => {
                                console.log('开启后台定位失败', res)
                                wx.startLocationUpdate({
                                        success: res => {
                                                wx.onLocationChange(res => {
                                                        console.log('location change', res)
                                                        self.checkUpdateLocation(res);
                                                })
                                                wx.offLocationChange(res => {
                                                        console.log('location off', res)
                                                })
                                        },
                                        fail: res => {
                                                wx.showModal({
                                                        content: res.errMsg,
                                                });
                                        },
                                });
                        },
                });
        },
        updateLocalCache() {
                var self = this;
                wx.setStorage({
                        key: "address",
                        data: self.globalData.address
                })
                wx.setStorage({
                        key: "openid",
                        data: self.globalData.openid
                })
                wx.setStorage({
                        key: "userInfo",
                        data: self.globalData.userInfo
                })
        },
        updateAddress(title, latitude, longitude) {
                var self = this;
                this.globalData.address = {
                        title: title,
                        latitude: latitude,
                        longitude: longitude,
                };
                wx.setStorage({
                        key: "address",
                        data: self.globalData.address
                })
        },
        getLocalCache() {
                var address = wx.getStorageSync("address")
                if (address) {
                        this.globalData.address = address;
                }

                var openid = wx.getStorageSync("openid")
                if (openid) {
                        this.globalData.openid = openid;
                }
                var userInfo = wx.getStorageSync("userInfo")
                if (userInfo) {
                        this.globalData.userInfo = userInfo;
                }
        }
})
