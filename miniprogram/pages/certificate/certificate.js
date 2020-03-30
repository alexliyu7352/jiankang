const dbHelp = require('../../utils/dbHelp.js')
const util = require('../../utils/util.js');
const app = getApp();
Page({

        /**
         * 页面的初始数据
         */
        data: {
                Shake: 0,
                userInfo: null,
                startObj: null,
        },

        /**
         * 生命周期函数--监听页面加载
         */
        onLoad: function (options) {
                wx.showShareMenu({
                        withShareTicket: true
                })
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
                        title: '我已经成功自我隔离' +self.data.startObj.days + "天" ,
                        path: 'pages/index/index'
                }

        }, navTo: function (e) {
                wx.navigateTo({
                        url: e.currentTarget.dataset.url,
                })
        },
})