// miniprogram/pages/about/about.js
Page({

        /**
         * 页面的初始数据
         */
        data: {
                templateId: '',
                subscribeMessageResult: '',
                requestSubscribeMessageResult: '',
                wxacodeSrc: '',
                wxacodeResult: '',
                showClearWXACodeCache: false,
        },

        /**
         * 生命周期函数--监听页面加载
         */
        onLoad: function (options) {

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

        }, onGetWXACode() {

                this.setData({
                        wxacodeSrc: '',
                        wxacodeResult: '',
                        showClearWXACodeCache: false,
                })

                // 此处为演示，将使用 localStorage 缓存，正常开发中文件 ID 应存在数据库中
                const fileID = wx.getStorageSync('wxacodeCloudID')

                if (fileID) {
                        // 有云文件 ID 缓存，直接使用该 ID
                        // 如需清除缓存，选择菜单栏中的 “工具 -> 清除缓存 -> 清除数据缓存”，或在 Storage 面板中删掉相应的 key
                        this.setData({
                                wxacodeSrc: fileID,
                                wxacodeResult: `从本地缓存中取得了小程序码的云文件 ID`,
                                showClearWXACodeCache: true,
                        })
                        console.log(`从本地缓存中取得了小程序码的云文件 ID：${fileID}`)
                } else {
                        wx.cloud.callFunction({
                                name: 'openapi',
                                data: {
                                        action: 'getWXACode',
                                },
                                success: res => {
                                        console.warn('[云函数] [openapi] wxacode.get 调用成功：', res)
                                        wx.showToast({
                                                title: '调用成功',
                                        })
                                        this.setData({
                                                wxacodeSrc: res.result,
                                                wxacodeResult: `云函数获取二维码成功`,
                                                showClearWXACodeCache: true,
                                        })
                                        wx.setStorageSync('wxacodeCloudID', res.result)
                                },
                                fail: err => {
                                        wx.showToast({
                                                icon: 'none',
                                                title: '调用失败',
                                        })
                                        console.error('[云函数] [openapi] wxacode.get 调用失败：', err)
                                }
                        })
                }
        },

        clearWXACodeCache() {
                wx.removeStorageSync('wxacodeCloudID')

                this.setData({
                        wxacodeSrc: '',
                        wxacodeResult: '',
                        showClearWXACodeCache: false,
                })

                wx.showToast({
                        title: '清除成功',
                })
        }
})