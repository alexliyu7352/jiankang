const config = require('../../config')
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
const dbHelp = require('../../utils/dbHelp.js')
const util = require('../../utils/util.js');
const app = getApp();
var qqmapsdk = new QQMapWX({
        key: config.mapKey
});
Page({

        /**
         * 页面的初始数据, 需要获得不同的权限
         */
        data: {
                userInfo: null,
                address: null,
                hasPermssion: false,
                hasUserInfo: false,
                hasLocationPremssion: false,
                hasAddressPremsson: false,

                startObj: null,
                scale: 18,
                markers: [],  //地图参数
                circles: [],  //区域
                latitude: "", //纬度 
                longitude: "",  //经度
                polyline: [{
                        points: [],
                        color: "#FF0000DD",
                        width: 5,
                        dottedLine: false
                }],   //路线
                tolatitude: "", //目的地纬度
                tolongitude: "", //目的地经度
                addressTitle: '',//poi地址标题
                addressDes: '', //poi地址详细 
                distance: '',  //poi距离: 起点到终点的距离，单位：米，
                duration: '', //poi时间: 表示从起点到终点的结合路况的时间，秒为单位 注：步行方式不计算耗时，该值始终为0 

                pointArr: [],
                addressArr: [], //多个地址的列表
                multiToMap: [], //存储多个地址终点

                pointIsShow: true,
                adrIsShow: false, //地址列表是否展示
                pioIsShow: false,  //pio模块是否展示

                isPioAdrPopping: false,//pio地址是否弹出
                pioAdrAnimPlus: {},//pio地址动画
        },

        /**
         * 生命周期函数--监听页面加载
         */
        onLoad: function (options) {
                let self = this;
                qqmapsdk = new QQMapWX({
                        key: config.mapKey
                });
                self.qqmapsdk = qqmapsdk;
        },

        /**
         * 生命周期函数--监听页面初次渲染完成
         */
        onReady: function () {
                this.mapCtx = wx.createMapContext('myMap')
        },

        /**
         * 生命周期函数--监听页面显示
         */
        onShow: function () {
                let self = this;
                self.checkPermission().then(ret => {
                        if (self.data.hasPermssion) {
                                self.doUpdateLocation();
                                self.getMyMapLocation();
                        }
                })
        },

        /**
         * 生命周期函数--监听页面隐藏
         */
        onHide: function () {

        },

        /**
         * 生命周期函数--监听页面卸载
         */
        onUnload: function () {

        },

        /**
         * 页面相关事件处理函数--监听用户下拉动作
         */
        onPullDownRefresh: function () {

        },

        /**
         * 页面上拉触底事件的处理函数
         */
        onReachBottom: function () {

        },

        /**
         * 用户点击右上角分享
         */
        onShareAppMessage: function () {

        },
        async checkPermission() {
                let self = this;
                var res = await util.getWxPromiseObject().getSetting();
                if (res.authSetting['scope.userInfo']) {
                        // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                        await self.updateUserInfo();
                };
                if (res.authSetting['scope.address']) {
                        await self.updateAddressInfo();
                }
                if (res.authSetting['scope.userLocationBackground']) {
                        self.setData({ hasLocationPremssion: true })
                }
                if (self.data.hasAddressPremsson && self.data.hasLocationPremssion && self.data.hasUserInfo) {
                        self.setData({ hasPermssion: true })
                }
                return self.data.hasPermssion
                /* wx.getSetting({
                         success(res) {
                                 if (res.authSetting['scope.userInfo']) {
                                         // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                                         self.updateUserInfo();
                                 };
                                 if (res.authSetting['scope.address']) {
                                         self.updateAddressInfo();
                                 }
                                 if (res.authSetting['scope.userLocationBackground']) {
                                          self.setData({ hasLocationPremssion: true })
                                 }
                                 if (self.data.hasAddressPremsson && self.data.hasLocationPremssion && self.data.hasUserInfo) {
                                         self.setData({ hasPermssion: true })
                                 }
                         }
                 }); */

        },
        async updateUserInfo() {
                let self = this;
                try {
                        var res = await util.getWxPromiseObject().getUserInfo();
                        app.globalData.userInfo = res.userInfo;
                        self.setData({
                                userInfo: res.userInfo,
                                hasUserInfo: true
                        })
                        await wx.cloud.callFunction({
                                name: 'login',
                                data: {}
                        }).then(res => {
                                console.log('[云函数] [login] user openid: ', res.result.openid)
                                app.globalData.openid = res.result.openid;
                                app.updateLocalCache();
                        }).catch(err => {
                                console.error('[云函数] [login] 调用失败', err)
                                wx.showModal({
                                        title: '获取openID失败',
                                        content: '请联系我们获取进一步信息',
                                })
                        })
                } catch (e) {

                }

                /* wx.getUserInfo({
                        success: function (res) {
                                app.globalData.userInfo = res.userInfo;
                                self.setData({
                                        userInfo: res.userInfo,
                                        hasUserInfo: true
                                })
                                wx.cloud.callFunction({
                                        name: 'login',
                                        data: {},
                                        success: res => {
                                                console.log('[云函数] [login] user openid: ', res.result.openid)
                                                app.globalData.openid = res.result.openid;
                                                app.updateLocalCache();
                                        },
                                        fail: err => {
                                                console.error('[云函数] [login] 调用失败', err)
                                                wx.showModal({
                                                        title: '获取openID失败',
                                                        content: '请联系我们获取进一步信息',
                                                })
                                        }
                                })
                        }
                }) */
        },
        async updateAddressInfo() {
                let self = this;
                if (app.globalData.address) {
                        self.setData({
                                address: app.globalData.address,
                                hasAddressPremsson: true
                        })
                        return;
                }
                await util.getWxPromiseObject().chooseAddress().then(res => {
                        var addressString = res.provinceName + res.cityName + res.countyName + res.detailInfo;
                        //调用地址解析接口
                        qqmapsdk.geocoder({
                                address: addressString || '', //获取表单传入的位置坐标,不填默认当前位置,示例为string格式
                                //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
                                success: function (res) {//成功后的回调
                                        console.log(res);
                                        var res = res.result;
                                        var latitude = res.location.lat;
                                        var longitude = res.location.lng;
                                        //根据地址解析在地图上标记解析地址位置
                                        app.updateAddress(res.title, latitude, longitude);
                                },
                                fail: function (error) {
                                        console.error(error);
                                },
                                complete: function (res) {
                                        console.log(res);
                                }
                        })
                        self.setData({
                                address: app.globalData.address,
                                hasAddressPremsson: true
                        })
                }).catch(res => {
                        console.log(res.errMsg);
                        wx.showToast({
                                title: res.errMsg,
                        })
                })
                /* await wx.chooseAddress({
                        success: res => {
                                var addressString = res.provinceName + res.cityName + res.countyName + res.detailInfo;
                                //调用地址解析接口
                                qqmapsdk.geocoder({
                                        address: addressString || '', //获取表单传入的位置坐标,不填默认当前位置,示例为string格式
                                        //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
                                        success: function (res) {//成功后的回调
                                                console.log(res);
                                                var res = res.result;
                                                var latitude = res.location.lat;
                                                var longitude = res.location.lng;
                                                //根据地址解析在地图上标记解析地址位置
                                                app.updateAddress(res.title, latitude, longitude);
                                        },
                                        fail: function (error) {
                                                console.error(error);
                                        },
                                        complete: function (res) {
                                                console.log(res);
                                        }
                                })
                                self.setData({
                                        address: app.globalData.address,
                                        hasAddressPremsson: true
                                })
                        },
                        fail: res => {
                                console.log(res.errMsg);
                                wx.showToast({
                                        title: res.errMsg,
                                })
                        }
                }) */
        },
        onGotUserInfo: function (e) {
                if (e.detail.userInfo) {
                        app.globalData.userInfo = e.detail.userInfo
                        this.setData({
                                userInfo: e.detail.userInfo,
                                hasUserInfo: true
                        })
                }
                console.log(e.detail.errMsg)
                console.log(e.detail.userInfo)
                console.log(e.detail.rawData)
        }, markYq: function () {
                var self = this;
                qqmapsdk.reverseGeocoder({
                        location: { latitude: self.data.latitude, longitude: self.data.longitude },
                        //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
                        success: function (res) {//成功后的回调
                                app.globalData.currentLocation = res.result;
                                // 这里判断是否需要上报开始
                                var myTimeSlotUTC = Date.now() //Using database at last. I decide to use exact time finally and not to eschew two more calls of if clause
                                if (!app.globalData.isStart) {
                                        app.globalData.isStart = true;
                                        dbHelp.startSubmit(res.result.location.lat, res.result.location.lng, res.result.address, myTimeSlotUTC)
                                }
                                var startObj = dbHelp.getStart();
                                dbHelp.getYiqingByCity(app.globalData.currentLocation.address_component.city)
                                        .then(res => {
                                                var mks = [];//存makers地标显示
                                                var adr = []; //存地址信息
                                                var data = res.data;
                                                for (var i = 0; i < data.length; i++) {
                                                        var title = data[i].community;
                                                        if (util.isNull(data[i].community)) {
                                                                title = data[i].full_address.split("市")[1]
                                                        }
                                                        mks.push({
                                                                id: data[i].id,
                                                                title: title,
                                                                address: data[i].full_address,
                                                                latitude: data[i].latitude,
                                                                longitude: data[i].longitude,
                                                                iconPath: "../../images/yiqing.png",
                                                                width: 30,
                                                                height: 30,
                                                                callout: {
                                                                        'display': 'ALWAYS', 'fontSize': '24rpx', 'content': title, 'bgColor': '#f20000',
                                                                        'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                                                }
                                                        });
                                                        var dis_list = util.getDistanceWithType(self.data.latitude, self.data.longitude, data[i].latitude, data[i].longitude)
                                                        adr.push({
                                                                id: data[i].id,
                                                                title: title,
                                                                address: data[i].full_address,
                                                                latitude: data[i].latitude,
                                                                longitude: data[i].longitude,
                                                                distance: dis_list[0],
                                                                distance_t: dis_list[1]
                                                        });
                                                }
                                                //多个地址终点
                                                var multiToMap = "";
                                                adr.map(function (v, i, array) {
                                                        multiToMap += v.latitude + "," + v.longitude + ";";
                                                });
                                                app.globalData.addressArr = adr;

                                                self.setData({
                                                        multiToMap: multiToMap.substring(0, multiToMap.length - 1)
                                                });

                                                self.setData({
                                                        startObj: startObj,
                                                        markers: self.data.originMarkers.concat(mks), //渲染markers
                                                        addressArr: adr,
                                                        pioIsShow: false,
                                                });
                                        })
                                        .catch(err => {
                                                console.error(err)
                                        })
                        }
                })
        }, getMultiDisDur: function () {

        },
        showYq: function () {
                this.setData({
                        adrIsShow: true,
                        pointIsShow: false
                })
        }, showPoint: function () {
                this.setData({
                        adrIsShow: false,
                        pointIsShow: true
                })
        },
        chooseSerTip: function (e) {
                let self = this,
                        title = e.currentTarget.dataset.title,
                        des = e.currentTarget.dataset.des,
                        duration = e.currentTarget.dataset.duration,
                        distance = e.currentTarget.dataset.distance,
                        lat = e.currentTarget.dataset.lat,
                        lng = e.currentTarget.dataset.lng;
                //console.log(lat+','+lng);
                self.setData({
                        tolatitude: lat,
                        tolongitude: lng
                })
                self.mapCtx.moveToLocation({
                        latitude: lat,
                        longitude: lng,
                        success: res => {
                                console.log(res)
                        },
                        fail: res => {
                                console.log(res)
                        }
                })
                var poiMks2 = [];
                var icon = "../../images/yiqing.png";
                if (self.data.pointIsShow){
                        icon = "../../images/map_danger.png";
                        title = des;
                }else{
                        icon = "../../images/yiqing.png";
                }
                poiMks2 = [{
                        id: "11111",
                        latitude: lat,
                        longitude: lng,
                        iconPath: icon,
                        width: 30,
                        height: 30,
                        callout: {
                                'display': 'ALWAYS', 'fontSize': '24rpx', 'content': title,
                                'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                        }
                }]

                //渲染markers
                self.setData({
                        markers: self.data.originMarkers.concat(poiMks2),
                        pioIsShow: true,
                        isPioAdrPopping: true,
                })
        },
        getMyMapLocation: function () {
                let that = this;
                //自行查询经纬度 http://www.gpsspg.com/maps.htm
                wx.getLocation({
                        type: 'gcj02',  //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
                        success(res) {
                                // 当前自己的经纬度 res.latitude，res.longitude
                                app.globalData.currentLatitude = res.latitude
                                app.globalData.currentLongitude = res.longitude

                                that.setData({
                                        latitude: res.latitude,
                                        longitude: res.longitude,
                                        originMarkers: [{
                                                id: "0",
                                                latitude: res.latitude,
                                                longitude: res.longitude,
                                                iconPath: "../../images/map_point.png",
                                                width: 40,
                                                height: 40,
                                                callout: {
                                                        'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的当前位置',
                                                        'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                                }
                                        }, {
                                                id: "1",
                                                latitude: that.data.address.latitude,
                                                longitude: that.data.address.longitude,
                                                iconPath: "../../images/map_home.png",
                                                width: 40,
                                                height: 40,
                                                callout: {
                                                        'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的家',
                                                        'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                                }
                                        }],
                                        markers: [{
                                                id: "0",
                                                latitude: res.latitude,
                                                longitude: res.longitude,
                                                iconPath: "../../images/map_point.png",
                                                width: 40,
                                                height: 40,
                                                callout: {
                                                        'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的当前位置',
                                                        'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                                }
                                        }, {
                                                id: "1",
                                                latitude: that.data.address.latitude,
                                                longitude: that.data.address.longitude,
                                                iconPath: "../../images/map_home.png",
                                                width: 40,
                                                height: 40,
                                                callout: {
                                                        'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的家',
                                                        'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                                }
                                        }],
                                        circles: [{
                                                latitude: res.latitude,
                                                longitude: res.longitude,
                                                fillColor: '#7cb5ec88',
                                                color: 'transparent',
                                                radius: 100,
                                                strokeWidth: 1
                                        }],
                                })
                                that.markYq();
                        }
                })

        },
        async getAddress() {
                let self = this;
                var res = await util.getWxPromiseObject().getSetting();
                if (!res.authSetting['scope.address']) {
                        wx.authorize({
                                scope: 'scope.address',
                                fail: res => {
                                        console.log(res.errMsg);
                                        wx.showModal({
                                                title: '需要权限',
                                                content: res.errMsg,
                                        })
                                },
                                success: res => {
                                        // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
                                        self.updateAddressInfo();
                                }
                        })
                } else {
                        self.updateAddressInfo();
                }

        }, getLocationPremssion: function () {
                var self = this;
                wx.getSetting({
                        success(res) {
                                if (!res.authSetting['scope.userLocation']) {
                                        wx.authorize({
                                                scope: 'scope.userLocation',
                                                fail: res => {
                                                        console.log(res.errMsg);
                                                        wx.showModal({
                                                                title: '需要权限',
                                                                content: '请打开与地理位置相关的所有权限',
                                                                showCancel: false,
                                                                success: ret => {
                                                                        if (ret.confirm) {
                                                                                wx.openSetting({
                                                                                        success: function (res) {
                                                                                                if (res.authSetting["scope.userLocation"]) {
                                                                                                        //这里是授权成功之后 填写你重新获取数据的js
                                                                                                        self.getLocationBackgroundPremssion()
                                                                                                } else {
                                                                                                        self.getLocationPremssion()
                                                                                                }
                                                                                        }
                                                                                })
                                                                        }
                                                                }
                                                        })
                                                },
                                                success: res => {
                                                        self.getLocationBackgroundPremssion()
                                                }
                                        })
                                } else {
                                        self.getLocationBackgroundPremssion()
                                }
                        }
                })
        }, getLocationBackgroundPremssion: function () {
                var self = this;
                wx.getSetting({
                        success: res => {
                                if (!res.authSetting['scope.userLocationBackground']) {
                                        wx.authorize({
                                                scope: 'scope.userLocationBackground',
                                                fail: res => {
                                                        wx.showModal({
                                                                title: '需要您设置权限',
                                                                content: '请在位置信息中选择使用时与离开后',
                                                                showCancel: false,
                                                                success: ret => {
                                                                        if (ret.confirm) {
                                                                                wx.openSetting({
                                                                                        success: function (res) {
                                                                                                if (res.authSetting["scope.userLocationBackground"]) {
                                                                                                        //这里是授权成功之后 填写你重新获取数据的js
                                                                                                        self.setData({
                                                                                                                hasLocationPremssion: true,
                                                                                                                hasPermssion: true
                                                                                                        })
                                                                                                        self.getMyMapLocation();
                                                                                                        self.doUpdateLocation();
                                                                                                } else {
                                                                                                        self.getLocationBackgroundPremssion()
                                                                                                }
                                                                                        }
                                                                                })
                                                                        }
                                                                }
                                                        })
                                                },
                                                success: res => {
                                                        self.setData({
                                                                hasLocationPremssion: true,
                                                                hasPermssion: true
                                                        })
                                                        self.getMyMapLocation();
                                                        self.doUpdateLocation();
                                                }
                                        })
                                } else {
                                        self.setData({
                                                hasLocationPremssion: true,
                                                hasPermssion: true
                                        })
                                        self.getMyMapLocation();
                                        self.doUpdateLocation();
                                }
                        }
                })
        }
        , async controltap(e) {
                this.mapCtx.moveToLocation();
                this.load_location();
        }, regionchange(e) {
                console.log(e, "regionchange")
        },
        markertap(e) {
                console.log(e.markerId, "markertap")
        },
        settingtap: function () {
                wx.openSetting({
                        success: function (res) {
                                if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"]) {
                                        //这里是授权成功之后 填写你重新获取数据的js
                                        that.getLogiCallback('', function () {
                                                callback('')
                                        })
                                }
                        }
                })
        },
        checkUpdateLocation: function (res) {
                var self = this;
                var ps = this.data.polyline["0"].points;
                // 计算是否移动超过10米，如果超过则进行上报
                var dis_list = util.getDistanceWithType(self.data.latitude, self.data.longitude, res.latitude, res.longitude)
                self.setData({
                        latitude: res.latitude, //纬度 
                        longitude: res.longitude,  //经度
                });
                if (dis_list[0] > 10) {
                        // 开始上报数据
                        var startObj = dbHelp.getStart();
                        self.setData({
                                startObj: startObj
                        });
                        qqmapsdk.reverseGeocoder({
                                location: { latitude: res.latitude, longitude: res.longitude },
                                //get_poi: 1, //是否返回周边POI列表：1.返回；0不返回(默认),非必须参数
                                success: function (res) {//成功后的回调
                                        // app.globalData.currentLocation = res.result;
                                        var res = res.result;
                                        var dis_list = util.getDistanceWithType(self.data.address.latitude, self.data.address.longitude, res.location.lat, res.location.lng)
                                        var current = {
                                                id: 999,
                                                title: util.formatDateTime(new Date()),
                                                address: res.address,
                                                latitude: res.location.lat,
                                                longitude: res.location.lng,
                                                distance: dis_list[0],
                                                distance_t: dis_list[1]
                                        };
                                        self.data.pointArr.unshift(current);
                                        dbHelp.putPointCache(current);

                                        var point = {
                                                latitude: res.location.lat,
                                                longitude: res.location.lng
                                        };
                                        console.log("point", point);
                                        ps.push(point);
                                        self.setData({
                                                pointArr: self.data.pointArr,
                                                polyline: [{
                                                        points: ps,
                                                        color: "#ff6600",
                                                        width: 5,
                                                        dottedLine: false,
                                                        arrowLine: true
                                                }]
                                        });
                                }
                        })
                }
        },
        doUpdateLocation: function () {
                app.doUpdateLocation();
                var self = this;
                setTimeout(function () {
                        console.log('开始页面内进行跟踪')
                        wx.onLocationChange(res => {
                                console.log('location change', res)
                                self.checkUpdateLocation(res);
                        })
                }, 2000)
        },
        async load_location() {
                var self = this;
                var ps = [];
                wx.showToast({
                        title: '数据加载...',
                        icon: 'loading',
                        duration: 1000,
                });
                var currentDate = util.formatDate(new Date());
                var point_list = await dbHelp.getPointCache(currentDate, app.globalData.openid)
                // 清除坐标
                self.setData({
                        pointArr: [],
                        polyline: [{
                                points: [],
                                color: "#ff6600",
                                width: 5,
                                dottedLine: false,
                                arrowLine: true
                        }]
                });
                for (var i = 0; i < point_list.length; i++) {
                        self.data.pointArr.unshift(point_list[i]);
                        var point = {
                                latitude: point_list[i].latitude,
                                longitude: point_list[i].longitude
                        };
                        console.log("point", point);
                        ps.push(point);
                }
                self.setData({
                        pointArr: self.data.pointArr,
                        polyline: [{
                                points: ps,
                                color: "#ff6600",
                                width: 5,
                                dottedLine: false,
                                arrowLine: true
                        }]
                });


        },
})