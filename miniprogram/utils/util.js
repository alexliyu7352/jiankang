/**
 * 工具类 util.js
 */
class Util {
        static formatTime(date) {
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();

                let hour = date.getHours();
                let minute = date.getMinutes();
                let second = date.getSeconds();

                //return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':');
                return [hour, minute, second].map(this.formatNumber).join(':');
        };
        static formatTimeShort(date) {
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();

                let hour = date.getHours();
                let minute = date.getMinutes();
                let second = date.getSeconds();

                //return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':');
                return [hour, minute].map(this.formatNumber).join(':');
        };
        static formatDateTime(date) {
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();

                let hour = date.getHours();
                let minute = date.getMinutes();
                let second = date.getSeconds();

                return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':');
                //return [hour, minute, second].map(this.formatNumber).join(':');
        };
        static formatDate(date) {
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();

                return [year, month, day].map(this.formatNumber).join('-');
        };

        static formatHour(date) {
                let hour = date.getHours();

                return this.formatNumber(hour);
        };

        static formatMinute(date) {
                let minute = date.getMinutes();

                return this.formatNumber(minute);
        };

        static formatSeconds(date) {
                let second = date.getSeconds();

                return this.formatNumber(second);
        };

        static formatNumber(n) {
                n = n.toString();
                return n[1] ? n : '0' + n;
        };

        /**
      * promise微信API方法
      */
        static wxPromise(api) {
                function func(options, ...params) {
                        return new Promise((resolve, reject) => {
                                api(
                                        Object.assign({}, options, {
                                                success: (res) => {
                                                        resolve(res)
                                                },
                                                fail: reject
                                        }),
                                        ...params
                                )
                        })
                }
                return func
        }

        static getWxPromiseObject() {
                let obj = {}
                for (const property in wx) {
                        obj[property] = this.wxPromise(wx[property])
                }
                return obj
        }
        static average = arr => arr.reduce((acc, val) => acc + val, 0)
        /**
   * @creator 新猿意码
   * @data 2019/01/17
   * @desc 由经纬度计算两点之间的距离，la为latitude缩写，lo为longitude
   * @param la1 第一个坐标点的纬度
   * @param lo1 第一个坐标点的经度
   * @param la2 第二个坐标点的纬度
   * @param lo2 第二个坐标点的经度
   * @return (int)s   返回距离(单位千米或公里)
   * @tips 注意经度和纬度参数别传反了，一般经度为0~180、纬度为0~90
   * 具体算法不做解释，有兴趣可以了解一下球面两点之间最短距离的计算方式
   * 修改，输出单位米
   */
        static getDistance = function (la1, lo1, la2, lo2) {
                var La1 = la1 * Math.PI / 180.0;
                var La2 = la2 * Math.PI / 180.0;
                var La3 = La1 - La2;
                var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
                var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
                s = s * 6378.137;
                //s = Math.round(s * 10000) / 10000;
                s = Math.round(s * 10000) / 10;
                s = s.toFixed(2);
                return s;
        }

        static getDistanceWithType = function (la1, lo1, la2, lo2) {
                var La1 = la1 * Math.PI / 180.0;
                var La2 = la2 * Math.PI / 180.0;
                var La3 = La1 - La2;
                var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
                var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
                s = s * 6378.137;
                //s = Math.round(s * 10000) / 10000;
                s = Math.round(s * 10000) / 10;
                s = s.toFixed(2);
                if (s >= 1000) {
                        s = s / 1000
                        s = s.toFixed(2);
                        return [s, s + "公里"]
                } else {
                        return [s, s + "米"];
                }
        }
        static isNull = n => {
                return (typeof n === 'undefined' || n === null || n === '');
        }

        static getRank = n => {
                switch (n) {
                        case 0 < n <= 2: {
                               return {
                                       image:"/images/1.png",
                                       title: "安全等级1",
                                       des:"安全1天以上"
                               }
                        }
                        case 2 < n <= 7: {
                                return {
                                        image: "/images/2.png",
                                        title: "安全等级2",
                                        des: "安全2天以上"
                                }
                        } case 7 < n <= 14: {
                                return {
                                        image: "/images/3.png",
                                        title: "安全等级3",
                                        des: "安全7天以上"
                                }
                        } case 14 < n <= 20: {
                                return {
                                        image: "/images/4.png",
                                        title: "安全等级4",
                                        des: "安全14天以上"
                                }
                        } case 20 < n: {
                                return {
                                        image: "/images/5.png",
                                        title: "安全等级5",
                                        des: "安全20天以上"
                                }
                        }
                        default: {
                                return {
                                        image: "/images/1.png",
                                        title: "安全等级1",
                                        des: "安全1天以上"
                                }
                        }
                }
        }
        static getDangerRank = n => {
                switch (n) {
                        case 90 < n: {
                                return {
                                        image: "/images/1.png",
                                        title: "安全等级1",
                                        des: "安全1天以上"
                                }
                        }
                        case 60 < n <= 90: {
                                return {
                                        image: "/images/2.png",
                                        title: "安全等级2",
                                        des: "安全2天以上"
                                }
                        } case 40 < n <= 60: {
                                return {
                                        image: "/images/3.png",
                                        title: "安全等级3",
                                        des: "安全7天以上"
                                }
                        } case 20 < n <= 40: {
                                return {
                                        image: "/images/4.png",
                                        title: "安全等级4",
                                        des: "安全14天以上"
                                }
                        } case n <= 20 : {
                                return {
                                        image: "/images/5.png",
                                        title: "安全等级5",
                                        des: "安全20天以上"
                                }
                        }
                        default: {
                                return {
                                        image: "/images/1.png",
                                        title: "安全等级1",
                                        des: "安全1天以上"
                                }
                        }
                }
        }
};

module.exports = Util;
