const util = require('./util.js');

const putPointCache=point=>{
        /* adr.push({
                id: 999,
                title: util.formatTime(myTimeSlotUTC),
                address: res.address,
                latitude: res.location.lat,
                longitude: res.location.lng,
                distance: dis_list[0],
                distance_t: dis_list[1]
        }); */
        var key = "point_log_" + util.formatDate(new Date());
        var logs = wx.getStorageSync(key) || []
        logs.push(point);
        wx.setStorage({
                key: key,
                data: logs,
        })
}

const getPointCache = async  (date, openid)=>{
       // date = '2020-02-26'
        var key = "point_log_" + date;
        var currentDate = new Date();
        currentDate.setTime(Date.parse(date))
        currentDate.setHours(0, 0, 0, 0);
        var startTimeStamp = currentDate.getTime();
        var stopTimeStamp = startTimeStamp + 86400*1000 * 1;
        console.log('start_time: ' + startTimeStamp, 'stop_time: ' + stopTimeStamp);

        var logs = wx.getStorageSync(key)
        if(util.isNull(logs)){
                // 从网络获取
                const db = wx.cloud.database()
                const _ = db.command
                const MAX_LIMIT = 20
                // 先取出集合记录总数
                const countResult = await db.collection('point_geo').where({
                        _openid: openid,
                        currentTime: _.gte(startTimeStamp).and(_.lte(stopTimeStamp))
                }).count()
                const total = countResult.total
                // 计算需分几次取
                const batchTimes = Math.ceil(total / MAX_LIMIT)
                // 承载所有读操作的 promise 的数组
                const tasks = []
                for (let i = 0; i < batchTimes; i++) {
                        const promise = db.collection('point_geo').field({
                                currentTime: true,
                                _id: true,
                                address: true,
                                latitude: true,
                                longitude: true,
                                distance: true,
                                distance_t: true,
                        }).where({
                                _openid: openid,
                                currentTime: _.gte(startTimeStamp).and(_.lte(stopTimeStamp))
                        }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
                        tasks.push(promise)
                }
                // 等待所有
               var result = (await Promise.all(tasks)).reduce((acc, cur) => {
                        return {
                                data: acc.data.concat(cur.data),
                                errMsg: acc.errMsg,
                        }
               }, { data: [] })
                if(result.data){
                        logs = []
                        for (var i = 0; i < result.data.length; i++) {
                                logs.push({
                                        id: result.data[i]._id,
                                        title: util.formatDateTime(new Date(result.data[i].currentTime)),
                                        address: result.data[i].address,
                                        latitude: result.data[i].latitude,
                                        longitude: result.data[i].longitude,
                                        distance: result.data[i].distance,
                                        distance_t: result.data[i].distance_t
                                })
                        }
                }
        }
       return logs;
}
const getGeoNearYq = async(latitude, longitude) =>{
        const db = wx.cloud.database()
        const $ = db.command.aggregate
        return db.collection('yq_xiaoqu').aggregate()
                .geoNear({
                        distanceField: 'distance', // 输出的每个记录中 distance 即是与给定点的距离
                        spherical: true,
                        limit:1,
                        near: db.Geo.Point(longitude, latitude),
                        key: 'location', // 若只有 location 一个地理位置索引的字段，则不需填
                        includeLocs: 'location', // 若只有 location 一个是地理位置，则不需填
                })
                .end()
}
const queryTrans = async (startTimeStamp, endTimeStamp, transNo) => {
       /*
        "createTime":1580129920000,
        "date":"2020-01-15",
        "endPos":"广安",
        "endTime":1579103999000,
        "id":119,
        "memo":"",
        "no":"前锋K102路公交车",
        "source":"https://weibo.com/1523766213/Irr32A1jG?type=comment#_rnd1580129889099",
        "startPos":"前锋",
        "startTime":1579075800000,
        "subNo":"",
        "type":5,
        "updateTime":1580129920000,
        "verified":1,
        "who":"广安区疾病预防控制中心"
        */
        // 1. 获取数据库引用
        const db = wx.cloud.database()
        const _ = db.command
        const MAX_LIMIT = 20
        // 先取出集合记录总数
        const countResult = await db.collection('xingcheng').where({
                startTime: _.gte(startTimeStamp),
                endTime: _.lte(endTimeStamp),
                no: db.RegExp({
                        regexp: '.*' + transNo,
                        options: 'i',
                }),
        }).count()
        const total = countResult.total
        // 计算需分几次取
        const batchTimes = Math.ceil(total / MAX_LIMIT)
        // 承载所有读操作的 promise 的数组
        const tasks = []
        for (let i = 0; i < batchTimes; i++) {
                const promise = db.collection('xingcheng').where({
                        startTime: _.gte(startTimeStamp),
                        endTime: _.lte(endTimeStamp),
                        no: db.RegExp({
                                regexp: '.*' + transNo,
                                options: 'i',
                        }),
                }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
                tasks.push(promise)
        }
        // 等待所有
        var result = (await Promise.all(tasks)).reduce((acc, cur) => {
                return {
                        data: acc.data.concat(cur.data),
                        errMsg: acc.errMsg,
                }
        }, { data: [] })
        return result
}

const queryTransByCity = async (startTimeStamp, endTimeStamp, city) => {
        /*
         "createTime":1580129920000,
         "date":"2020-01-15",
         "endPos":"广安",
         "endTime":1579103999000,
         "id":119,
         "memo":"",
         "no":"前锋K102路公交车",
         "source":"https://weibo.com/1523766213/Irr32A1jG?type=comment#_rnd1580129889099",
         "startPos":"前锋",
         "startTime":1579075800000,
         "subNo":"",
         "type":5,
         "updateTime":1580129920000,
         "verified":1,
         "who":"广安区疾病预防控制中心"
         */
        // 1. 获取数据库引用
        const db = wx.cloud.database()
        const _ = db.command
        const MAX_LIMIT = 20
        // 先取出集合记录总数
        const countResult = await db.collection('xingcheng').where({
                startTime: _.gte(startTimeStamp),
                endTime: _.lte(endTimeStamp),
        }).where(_.or([
                {
                        startPos: db.RegExp({
                                regexp: '.*' + city,
                                options: 'i',
                        })
                },{
                        endPos: db.RegExp({
                                regexp: '.*' + city,
                                options: 'i',
                        })
                }
        ])).count()
        const total = countResult.total
        // 计算需分几次取
        const batchTimes = Math.ceil(total / MAX_LIMIT)
        // 承载所有读操作的 promise 的数组
        const tasks = []
        for (let i = 0; i < batchTimes; i++) {
                const promise = db.collection('xingcheng').where({
                        startTime: _.gte(startTimeStamp),
                        endTime: _.lte(endTimeStamp),
                }).where(_.or([
                        {
                                startPos: db.RegExp({
                                        regexp: '.*' + city,
                                        options: 'i',
                                })
                        }, {
                                endPos: db.RegExp({
                                        regexp: '.*' + city,
                                        options: 'i',
                                })
                        }
                ])).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
                tasks.push(promise)
        }
        // 等待所有
        var result = (await Promise.all(tasks)).reduce((acc, cur) => {
                return {
                        data: acc.data.concat(cur.data),
                        errMsg: acc.errMsg,
                }
        }, { data: [] })
        return result
}

const getYiqingByCity = async city => {
        // 1. 获取数据库引用
        const db = wx.cloud.database()
        // 2. 构造查询语句
        // collection 方法获取一个集合的引用
        // where 方法传入一个对象，数据库返回集合中字段等于指定值的 JSON 文档。API 也支持高级的查询条件（比如大于、小于、in 等），具体见文档查看支持列表
        // get 方法会触发网络请求，往数据库取数据
      // city = "西安市"
     /*    return db.collection('yiqing').where({
                city: city,
        }).limit(1000).get(); */

        const _ = db.command
        const MAX_LIMIT = 20
        // 先取出集合记录总数
        const countResult = await db.collection('yq_xiaoqu').where({
                city: city
        }).count()
        const total = countResult.total
        // 计算需分几次取
        const batchTimes = Math.ceil(total / MAX_LIMIT)
        // 承载所有读操作的 promise 的数组
        const tasks = []
        for (let i = 0; i < batchTimes; i++) {
                const promise = db.collection('yq_xiaoqu').where({
                        city: city
                }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
                tasks.push(promise)
        }
        // 等待所有
        var result = (await Promise.all(tasks)).reduce((acc, cur) => {
                return {
                        data: acc.data.concat(cur.data),
                        errMsg: acc.errMsg,
                }
        },{data:[]})
        return result
}
const getStart=()=> {
        var key = "follow_start";
        var startObj = wx.getStorageSync(key)
        if(util.isNull(startObj)){
                //从服务器上获取
                db.collection('user_info').orderBy('currentTime', 'desc').limit(1).get().then(res => {
                        // res.data 包含该记录的数据
                        var data = res.data;
                        if(!util.isNull(data)){
                                startObj = data[0]
                        }
                })
        }
        if (util.isNull(startObj)) {
                startObj = {
                                latitude: 0,
                                longitude: 0,
                                address: "无",
                                currentTime: Date.now()
                }
        }
        // 这里开始计算等级以及隔离时长
        var timeDu = Date.now() - startObj.currentTime;
        var days = Math.round(timeDu / 1000) / 86400;
        days = days.toFixed(2);
        var currentDate = new Date();
        currentDate.setTime(startObj.currentTime)
        var dateString = util.formatDateTime(currentDate)
        startObj.rank = util.getRank(days)
        startObj.days = days;
        startObj.dateString = dateString;
        return startObj;
}

const startSubmit = (lat, lng, address, currentTime) => {
        var key = "follow_start";
        wx.setStorage({
                key: key,
                data: {
                        latitude: lat,
                        longitude: lng,
                        address: address,
                        currentTime: currentTime
                },
        })

        const db = wx.cloud.database()
        db.collection('user_info').add({
                data: {
                        currentTime: currentTime, //The time slot var name changed to ZTimeSlotUTC while uploading to cloud
                        location: {
                                type: 'Point',
                                coordinates: [lng, lat]
                        },
                        latitude: lat,
                        longitude: lng,
                        address: address,
                },
                /*--Attention END----CLOUD DATABASE COLLECT TABLE STRCTURE DESIGN BLOCK HERE------注意-------*/
                success: res => {
                        wx.showToast({
                                icon: 'success',
                                title: '开始跟踪您',
                        })
                        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                },
                fail: err => {
                        wx.showToast({
                                icon: 'none',
                                title: '上报数据未成功'
                        })
                        console.error('[数据库] [新增记录] 失败：', err)
                }
        })
}
const yiQingSubmit = (lat, lng, address, dis_list, currentTime)=>{
        const db = wx.cloud.database()
        
        db.collection('point_geo').add({
                data: {
                        currentTime: currentTime, //The time slot var name changed to ZTimeSlotUTC while uploading to cloud
                        location: {
                                type: 'Point',
                                coordinates: [lng, lat]
                        },
                        latitude: lat,
                        longitude: lng,
                        address: address,
                        distance: dis_list[0],
                        distance_t: dis_list[1]
                },
                /*--Attention END----CLOUD DATABASE COLLECT TABLE STRCTURE DESIGN BLOCK HERE------注意-------*/
                success: res => {
                        wx.showToast({
                                icon: 'success',
                                title: '已上报您当前位置',
                        })
                        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                },
                fail: err => {
                        wx.showToast({
                                icon: 'none',
                                title: '上报未成功'
                        })
                        console.error('[数据库] [新增记录] 失败：', err)
                }
        })
}

const analyticsSubmit = (startTime, endTime, currentTime, dangerPercent, report) => {
        var key = "analytics_report";
        wx.setStorage({
                key: key,
                data: {
                        startTime: startTime,
                        endTime: endTime,
                        report: report,
                        total:report.length,
                        dangerPercent: dangerPercent,
                        currentTime: currentTime
                },
        })

        const db = wx.cloud.database()
        db.collection('analytics_report').add({
                data: {
                        currentTime: currentTime, //The time slot var name changed to ZTimeSlotUTC while uploading to cloud
                        startTime: startTime,
                        endTime: endTime,
                        dangerPercent: dangerPercent,
                        total: report.length,
                        report: report
                },
                /*--Attention END----CLOUD DATABASE COLLECT TABLE STRCTURE DESIGN BLOCK HERE------注意-------*/
                success: res => {
                        wx.showToast({
                                icon: 'success',
                                title: '已成功提交报告',
                        })
                        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
                },
                fail: err => {
                        wx.showToast({
                                icon: 'none',
                                title: '上报数据未成功'
                        })
                        console.error('[数据库] [新增记录] 失败：', err)
                }
        })
}
const queryYqByCity = async city => {
        // 1. 获取数据库引用
        const db = wx.cloud.database()
        const countResult = await db.collection('yq_city').where({
                name: db.RegExp({
                        regexp: city,
                        options: 'i',
                })
        }).count()
        return countResult.total
}

module.exports = {
        getYiqingByCity,
        startSubmit,
        yiQingSubmit,
        putPointCache,
        getPointCache,
        getStart,
        getGeoNearYq,
        queryTransByCity,
        queryTrans,
        analyticsSubmit,
        queryYqByCity
}