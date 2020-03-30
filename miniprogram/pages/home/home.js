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
                start_date: util.formatDate(new Date()),
                userInfo: null,
                address: null,
                scale: 16,
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
                pointArr: [],
                addressArr: [], //多个地址的列表
                multiToMap: [], //存储多个地址终点

                pointIsShow: true,
                adrIsShow: true, //地址列表是否展示
                pioIsShow: true,  //pio模块是否展示
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
                let self = this;
                this.mapCtx = wx.createMapContext('myRecordMap')
                self.getMyMapLocation();
                self.load_location(self.data.start_date)
        },

        /**
         * 生命周期函数--监听页面显示
         */
        onShow: function () {
                let self = this;

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
        markYq: function () {
                var self = this;
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
                                        var dis_list = util.getDistanceWithType(self.data.address.latitude, self.data.address.longitude, data[i].latitude, data[i].longitude)
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
                                        markers: self.data.originMarkers.concat(mks), //渲染markers
                                        addressArr: adr,
                                        pioIsShow: false,
                                });
                        })
                        .catch(err => {
                                console.error(err)
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
                poiMks2 = [{
                        id: "11111",
                        latitude: lat,
                        longitude: lng,
                        iconPath: "../../images/map_danger.png",
                        width: 30,
                        height: 30,
                        callout: {
                                'display': 'ALWAYS', 'fontSize': '24rpx', 'content': des,
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
                var self = this;
                self.data.address = app.globalData.address
                if (self.data.address) {
                        self.setData({
                                latitude: self.data.address.latitude,
                                longitude: self.data.address.longitude,
                                originMarkers: [{
                                        id: "1",
                                        latitude: self.data.address.latitude,
                                        longitude: self.data.address.longitude,
                                        iconPath: "../../images/map_home.png",
                                        width: 40,
                                        height: 40,
                                        callout: {
                                                'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的家',
                                                'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                        }
                                }],
                                markers: [{
                                        id: "1",
                                        latitude: self.data.address.latitude,
                                        longitude: self.data.address.longitude,
                                        iconPath: "../../images/map_home.png",
                                        width: 40,
                                        height: 40,
                                        callout: {
                                                'display': 'ALWAYS', 'fontSize': '24rpx', 'content': '我的家',
                                                'padding': '6rpx', 'boxShadow': '0 0 5rpx #333', 'borderRadius': '2rpx'
                                        }
                                }],
                                circles: [{
                                        latitude: self.data.address.latitude,
                                        longitude: self.data.address.longitude,
                                        fillColor: '#7cb5ec88',
                                        color: 'transparent',
                                        radius: 100,
                                        strokeWidth: 1
                                }],
                        })
                }
                self.markYq();
        }
        , async controltap(e) {
                this.load_location(this.data.start_date);
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
        async load_location(currentDate) {
                var self = this;
                var ps = [];
                wx.showToast({
                        title: '数据加载...',
                        icon: 'loading',
                        duration: 1000,
                });
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
                if (ps.length > 0 && !util.isNull(ps[0].latitude)) {
                        self.mapCtx.moveToLocation({
                                latitude: ps[0].latitude,
                                longitude: ps[0].longitude,
                                success: res => {
                                        console.log(res)
                                },
                                fail: res => {
                                        console.log(res)
                                }
                        })
                } else {
                        self.mapCtx.moveToLocation()
                }

        }, bindDateStartChange: function (res) {
                this.setData({
                        start_date: res.detail.value
                });
                this.load_location(res.detail.value)
        }, regionchange(e) {
                console.log(e, "regionchange")
        },
        markertap(e) {
                console.log(e.markerId, "markertap")
        },
})