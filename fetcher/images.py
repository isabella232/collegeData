import os
import re
import json
import random
from scrapy import Spider

BASE = os.path.join(os.path.dirname(__file__), "..")
OUTPUT = os.path.join(BASE, "images")
with open(os.path.join(BASE, "conf.json")) as fh:
    CONF = json.load(fh)

if not os.path.exists(OUTPUT):
    os.makedirs(OUTPUT)

def image_urls():
    with open(os.path.join(BASE, "data", "imageData.json")) as fh:
        data = json.load(fh)

    urls = {}
    for school_id, images in data.iteritems():
        logo = images.get('schoolLogo')
        cover = images.get('coverPhoto')
        for url, key in ((logo, "logo"), (cover, "cover")):
            if url:
                filename = os.path.join(OUTPUT,
                    "{}-{}{}".format(school_id, key, os.path.splitext(url)[1])
                )
                if not os.path.exists(filename):
                    urls[url] = filename
    return urls

url_map = image_urls()

class ImageSpider(Spider):
    name = "imagespider"

    start_urls = url_map.keys()

    download_delay = CONF['throttle'] / 1000.

    def parse(self, res):
        if res.status == 200:
            filename = url_map[res.url]
            with open(filename, 'wb') as fh:
                fh.write(res.body)
        else:
            print "ERROR", res.status, res.url
