# -*- coding:utf-8 -*-
import requests as req
import re
from bs4 import BeautifulSoup
import json
import jsonpath
import pandas as pd
import numpy as np
#加header伪装成浏览器，反反爬
user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
headers = {'User-Agent': user_agent}
url_position='https://ncov.html5.qq.com/api/getPosition'#全国各省市数据
requests = req.session() 
r_position=requests.get(url_position, headers=headers)
data_position = BeautifulSoup(r_position.text,'lxml')
p1 = re.compile('<html><body><p>')
p2=re.compile('</p></body></html>')
data_position1=re.sub(p1,"",str(data_position))
data_position2=re.sub(p2,"",data_position1)
json1bj = json.loads(data_position2)
data=[]
area = {}
for i in json1bj['position']:
    for j in json1bj['position'][i]:
        for k in json1bj['position'][i][j]:
            dict1={'province':i,'city':j,'district':k}
            data.append(dict1)
df=pd.DataFrame(data)
df1=df[df['district']!='全部']
for p in data:
    province = p['province']
    if province not in area:
        area[province] = []
    if p['city'] not in area[province]:
        area[province].append(p['city'])

def get_info(province,city):
    url_community='https://ncov.html5.qq.com/api/getCommunity?province='+str(province)+'&city='+str(city)
    print(url_community)
    r_community = requests.get(url_community, headers=headers)
    data_community = BeautifulSoup(r_community.text,'lxml')
    p1= re.compile('<html><body><p>')
    p2=re.compile('</p></body></html>')
    data_community1=re.sub(p1,"",str(data_community))
    data_community2=re.sub(p2,"",data_community1)
    jsonObj = json.loads(data_community2)
    return jsonObj


def byteify(input, encoding='utf-8'):
    if isinstance(input, dict):
        return {byteify(key): byteify(value) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode(encoding)
    else:
        return input
    
def get_data(info):
    df = pd.DataFrame(columns = ['province','city','district','street','community','full_address','lat','lng'])
    info = byteify(info)
    df['province']=jsonpath.jsonpath(info,'$..province') 
    df['city']=jsonpath.jsonpath(info,'$..city') 
    df['district']=jsonpath.jsonpath(info,'$..district') 
    # 最外层的key也是community，该key对应的value不是我们想提取的数据，因此把community list中第一个值删除
    community = jsonpath.jsonpath(info,'$..community') 
    del community[0] 
    df['community']=community
    df['street']=jsonpath.jsonpath(info,'$..street') 
    df['full_address'] = jsonpath.jsonpath(info,'$..full_address') 
    df['lat']=jsonpath.jsonpath(info,'$..lat') 
    df['lng'] = jsonpath.jsonpath(info,'$..lng') 
    return df

all_community= pd.DataFrame(columns = ['province','city','district','street','community','full_address','lat','lng'])
for province, city_list in area.items():
    for city in city_list:
        info=get_info(province.encode("utf-8"),city.encode("utf-8"))
        all_community=pd.concat([all_community,get_data(info)])
all_community.to_excel('全国新型冠状肺炎小区.xlsx')
