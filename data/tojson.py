import requests as req
import re
from bs4 import BeautifulSoup
import json
import jsonpath
import pandas as pd
import numpy as np

output = []
csv_content = open("./xiaoqucsv.csv","r").read()
content_lines = csv_content.split("\r\n")

# "location":{"coordinates":[34.323065,108.685046],"type":"Point"},"latitude":34.323065,"longitude":108.685046
for line in content_lines:
    data = line.split(",")
    if data and len(data) > 5 and data[0]!='province' and data[6]!="":
        output.append(dict(province=data[0],city=data[1],district=data[2],street=data[3],
                           community=data[4],full_address=data[5],
                           latitude=float(data[6]),longitude=float(data[7]),
                           location={"coordinates":[float(data[7]),float(data[6])],"type":"Point"}))

content = ""

for obj in output:
    content += json.dumps(obj, ensure_ascii=False, encoding='utf-8')


f=open("xiaoqu.json","w")
f.write(content)
f.close()

