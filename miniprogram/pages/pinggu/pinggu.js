const dbHelp = require('../../utils/dbHelp.js')
const util = require('../../utils/util.js');
const app = getApp();
Page({

        /**
         * 页面的初始数据
         */
        data: {
                userInfo: null,
                result_list: [],
                analyticsResult: [],
                analyticsDescription: "",
                analyticsStartDate: null,
                analyticsEndDate: null,
                dangerPercent: 0,
                dangerRank:null,
                showRank: false,
                showTopTips: true,
                startDate: util.formatDate(new Date()),
                startTime: util.formatTimeShort(new Date()),
                endDate: "",
                endTime: "",
                showAnalytics: false,
                showAddressField: false,
                showInputField: false,
                showRadioField: false,
                showButton: false,
                address: {
                        title: "",
                        address: "",
                        latitude: "",
                        longitude: ""
                },
                formData: {
                        startDate: util.formatDate(new Date()),
                        startTime: util.formatTimeShort(new Date()),
                },
                rules: [{
                        name: 'radio',
                        rules: { required: true, message: '请至少选择一个' },
                }, {
                        name: 'startDate',
                        rules: { required: true, message: '必须输入' },
                }, {
                        name: 'startTime',
                        rules: { required: true, message: '必须输入' },
                }, {
                        name: 'endDate',
                        rules: [{ required: true, message: '必须输入' }, {
                                validator: function (rule, value, param, modeels) {
                                        if (!value || Date.parse(value) < Date.parse(modeels.startDate)) {
                                                return '结束日期不能小于开始日期'
                                        }
                                }
                        }],
                }, {
                        name: 'endTime',
                        rules: [{ required: true, message: '必须输入' }, {
                                validator: function (rule, value, param, modeels) {
                                        if (!value || !modeels.startDate || !modeels.endDate) {
                                                return '请先选择出行日期时间'
                                        } else {
                                                var startDateTime = modeels.startDate + " " + modeels.startTime
                                                var endDateTime = modeels.endDate + " " + value
                                                if (Date.parse(endDateTime) < Date.parse(startDateTime)) {
                                                        return '结束日期不能小于开始日期'
                                                }
                                        }
                                }
                        }],
                }, {
                        name: 'tanNo',
                        rules: {
                                validator: function (rule, value, param, modeels) {
                                        if (modeels.radio !== 8) {
                                                if (!value) {
                                                        return '请输入诸如车次之类的信息'
                                                }
                                        }
                                }
                        },
                }, {
                        name: 'address',
                        rules: {
                                validator: function (rule, value, param, modeels) {
                                        if (modeels.radio === 8) {
                                                if (!value || !value.address || !value.longitude || !value.longitude) {
                                                        return '请选择地点'
                                                }
                                        }
                                }
                        },
                }]
        },

        /**
         * 生命周期函数--监听页面加载
         */
        onLoad: function (options) {
                wx.showShareMenu({
                        withShareTicket: true
                })
                let self = this;
                self.getLocationPremssion();
        },

        /**
         * 生命周期函数--监听页面初次渲染完成
         */
        onReady: function () {

        },

        /**
         * 生命周期函数--监听页面显示
         */
        onShow: function () {
                this.setData({
                        Shake: 0,
                        userInfo: app.globalData.userInfo,
                        startObj: dbHelp.getStart()
                })
                let interval = setInterval(() => {
                        this.setData({
                                Shake: 1
                        })
                        clearInterval(interval)
                }, 100)
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
        onShareAppMessage: function (res) {
                var self = this;
                if (res.from === 'button') {
                        // 来自页面内转发按钮
                        console.log(res.target)
                }
                return {
                        title: '我的评估安全等级为' + self.data.dangerRank.title + ", 风险为" + dangerPercent+"%",
                        path: 'pages/pinggu/pinggu'
                }

        }, navTo: function (e) {
                wx.navigateTo({
                        url: e.currentTarget.dataset.url,
                })
        }, bindStartDateChange: function (e) {
                var self = this;
                this.setData({
                        startDate: e.detail.value,
                        [`formData.startDate`]: e.detail.value
                })
                self.isShowRadio()
        },
        bindStartTimeChange: function (e) {
                var self = this;
                this.setData({
                        startTime: e.detail.value,
                        [`formData.startTime`]: e.detail.value
                })
                self.isShowRadio()
        }, bindEndDateChange: function (e) {
                var self = this;
                this.setData({
                        endDate: e.detail.value,
                        [`formData.endDate`]: e.detail.value
                })
                self.isShowRadio()
        },
        bindEndTimeChange: function (e) {
                var self = this;
                this.setData({
                        endTime: e.detail.value,
                        [`formData.endTime`]: e.detail.value
                })
                self.isShowRadio()
        }, outTyperadioChange: function (e) {
                console.log('radio发生change事件，携带value值为：', e.detail.value);
                var value = parseInt(e.detail.value);
                if (value === 8) {
                        this.setData({
                                [`formData.radio`]: value,
                                showAddressField: true,
                                showInputField: false,
                        });
                } else {
                        this.setData({
                                [`formData.radio`]: value,
                                showAddressField: false,
                                showInputField: true,
                        });
                }
        }, formInputChange(e) {
                const { field } = e.currentTarget.dataset
                this.setData({
                        [`formData.${field}`]: e.detail.value,
                        showButton: true
                })
        }, submitForm() {
                var self = this;
                this.selectComponent('#form').validate((valid, errors) => {
                        console.log('valid', valid, errors)
                        if (!valid) {
                                const firstError = Object.keys(errors)
                                if (firstError.length) {
                                        this.setData({
                                                error: errors[firstError[0]].message
                                        })

                                }
                        } else {
                                wx.showModal({
                                        title: '校验通过',
                                        content: '您需要继续提交新的行程还是开始分析当前行程?',
                                        cancelText: '继续',
                                        confirmText: '开始分析',
                                        success: res => {
                                                if (res.confirm) {
                                                        self.data.result_list.push(self.data.formData)
                                                        self.doAnalytics()
                                                } else if (res.cancel) {
                                                        self.data.result_list.push(self.data.formData)
                                                }
                                                self.cleanInput();
                                        }
                                })
                        }
                })
                // this.selectComponent('#form').validateField('mobile', (valid, errors) => {
                //     console.log('valid', valid, errors)
                // })
        }, chooseLocation() {
                const self = this
                wx.chooseLocation({
                        success(res) {
                                console.log(res)
                                var address = {
                                        title: res.name,
                                        address: res.address,
                                        latitude: res.latitude,
                                        longitude: res.longitude
                                }
                                self.setData({
                                        address: address,
                                        [`formData.address`]: address,
                                        showButton: true
                                })
                        }
                })
        }, isShowRadio() {
                const self = this
                if (util.isNull(self.data.startDate) || util.isNull(self.data.startTime) || util.isNull(self.data.endDate) || util.isNull(self.data.endTime)) {
                        this.setData({
                                showRadioField: false,
                        })
                } else {
                        this.setData({
                                showRadioField: true,
                                // showInputField: true,
                        })
                }
        }, cleanForm(){
                var self = this;
                self.cleanInput()
                this.setData({
                        result_list: [],
                        analyticsResult: [],
                        analyticsDescription: "",
                        analyticsStartDate: null,
                        analyticsEndDate: null,
                        dangerPercent: 0,
                        dangerRank: null,
                        showRank: false,
                        showTopTips: true,
                        showAnalytics: false,
                })
        }, cleanInput() {
                var self = this;
                this.setData({
                        startDate: util.formatDate(new Date()),
                        startTime: util.formatTimeShort(new Date()),
                        endDate: "",
                        endTime: "",
                        showAddressField: false,
                        showInputField: false,
                        showRadioField: false,
                        showButton: false,
                        address: {
                                title: "",
                                address: "",
                                latitude: "",
                                longitude: ""
                        },
                        formData: {
                                startDate: util.formatDate(new Date()),
                                startTime: util.formatTimeShort(new Date()),
                        },
                })
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
        }, async doAnalytics() {
                var self = this;
                var analyticsResult = []
                var dangerList = []
                this.setData({
                        showAnalytics: true,
                })
                wx.showToast({
                        title: '正在提交云端分析...',
                        icon: 'loading',
                        duration: 10000,
                });
                // 这里开始进行评估, 评估方式分别是根据地点以及交通工具进行查询
                if (app.globalData.userInfo) {
                        this.setData({
                                userInfo: app.globalData.userInfo,
                        })
                } else {
                        await self.updateUserInfo();
                }
                this.setData({
                        analyticsDescription: "正在进行评估准备工作.....",
                })
                for (var i = 0; i < self.data.result_list.length; i++) {
                        if (i === 0) {
                                var startDateTime = self.data.result_list[i].startDate + " " + self.data.result_list[i].startTime
                                self.setData({
                                        analyticsStartDate: startDateTime
                                })
                        } if (i === self.data.result_list.length - 1) {
                                var endDateTime = self.data.result_list[i].endDate + " " + self.data.result_list[i].endTime
                                self.setData({
                                        analyticsEndDate: endDateTime
                                })
                        }
                        var result = await self.analyticItem(self.data.result_list[i])
                        analyticsResult.push(result)
                        if (result.danger > 0) {
                                dangerList.push(result.danger)
                        }
                        self.setData({
                                analyticsResult: self.data.analyticsResult.concat(analyticsResult),
                                analyticsDescription: "已检测行程" + (i+1) + "条, " + "其中具有风险的为" + dangerList.length + "条"
                        })
                }
                var percent = util.average(dangerList)
                percent = percent.toFixed(2)
                self.setData({
                        dangerRank: util.getDangerRank(percent),
                        dangerPercent: percent,
                        showRank: true,
                })

                dbHelp.analyticsSubmit(Date.parse(self.data.analyticsStartDate), Date.parse(self.data.analyticsEndDate), Date.now(), percent, analyticsResult)

        }, async analyticItem(item) {
                // 根据类型先判断
                var analyticsResult = {
                        // 这里记录评估结果, 分别是, 其中原则是如果定位距离小于100米, dange=100
                        latitude: null,
                        longitude: null,
                        title: null,
                        address: null,
                        distance: 0,
                        danger: 0,
                        description: "",
                }
                if (!item) {
                        return analyticsResult;
                }
                var startDateTime = Date.parse(item.startDate + " " + item.startTime)
                var endDateTime = Date.parse(item.endDate + " " + item.endTime)

                if (item.radio == 8) {
                        analyticsResult.latitude = item.address.latitude
                        analyticsResult.longitude = item.address.longitude
                        analyticsResult.address = item.address.address
                        analyticsResult.title = item.startDate + " " + item.startTime + "到" + item.endDate + " " + item.endTime
                        var city;
                        if (item.address.address.split("自治区").length === 1) {
                                if (item.address.address.search("省") !== -1) {
                                        city = item.address.address.split("省")[1].split("市")[0]
                                } else {
                                        city = item.address.address.split("市")[0]
                                }
                        } else {
                                city = item.address.address.split("自治区")[1].split("市")[0]
                        }
                        var ret = await dbHelp.getGeoNearYq(item.address.latitude, item.address.longitude).then(res => {
                                if (res.list && res.list.length > 0) {
                                        var ret = res.list[0]
                                        var distance = ret.distance;
                                        distance = distance.toFixed(2)
                                        analyticsResult.distance = distance
                                        var yAddress = ret.full_address
                                        if (!util.isNull(ret.community)) {
                                                yAddress = ret.community
                                        }
                                        if (distance < 100) {
                                                analyticsResult.danger = 100
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 500) {
                                                analyticsResult.danger = 80
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 1000) {
                                                analyticsResult.danger = 70
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 5000) {
                                                analyticsResult.danger = 50
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 10000) {
                                                analyticsResult.danger = 40
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 20000) {
                                                analyticsResult.danger = 30
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        } else if (distance < 70000) {
                                                analyticsResult.danger = 10
                                                analyticsResult.description = "距离疫情点" + yAddress + " " + distance + "米\n"
                                        }
                                }
                        })
                        var ret = await dbHelp.queryTransByCity(startDateTime, endDateTime, city);
                        if (ret && ret.length > 0) {
                                // 这里应该进一步的对子字段进行对比
                                analyticsResult.danger += 10
                                analyticsResult.description += "行程中出现在疫情爆发城市:" + city + "\n"
                        }
                        ret = await dbHelp.queryYqByCity(city);
                        if (ret  > 0) {
                                // 这里应该进一步的对子字段进行对比
                                analyticsResult.danger += 10
                                analyticsResult.description += "行程中出现在疫情爆发城市:" + city + "\n"
                        }
                        
                } else {
                        analyticsResult.latitude = 0
                        analyticsResult.longitude = 0
                        analyticsResult.address = "乘坐交通工具:" + item.tanNo
                        analyticsResult.title = item.startDate + " " + item.startTime + "到" + item.endDate + " " + item.endTime
                        var ret = await dbHelp.queryTrans(startDateTime, endDateTime, item.tanNo);
                        if (ret && ret.length > 0) {
                                // 这里应该进一步的对子字段进行对比
                                analyticsResult.danger = 40
                                analyticsResult.description = "乘坐交通工具" + ret[0].no + " 有感染风险\n"
                        }
                }
                return analyticsResult;
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
                                                                                                if (!res.authSetting["scope.userLocation"]) {
                                                                                                        self.getLocationPremssion()
                                                                                                }
                                                                                        }
                                                                                })
                                                                        }
                                                                }
                                                        })
                                                }
                                        })
                                }
                        }
                })
        }
})