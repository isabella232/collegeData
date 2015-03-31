import os
import re
from scrapy import Spider

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "raw_html")

if not os.path.exists(OUTPUT):
    os.makedirs(OUTPUT)

def slugify_url(url):
    return re.sub("[^-a-zA-Z0-9_\.]", "-", url)

def output_filename(url):
    return os.path.join(OUTPUT, slugify_url(url))

def generate_urls(start, end):
    urls = []
    for school in range(start, end + 1):
        for page in range(1, 7):
            url = "http://www.collegedata.com/cs/data/college/college_pg0{page}_tmpl.jhtml?schoolId={school}".format(school=school, page=page)
            if not os.path.exists(output_filename(url)):
                urls.append(url)
    return urls

class CollegeSpider(Spider):
    name = "collegespider"

    start_urls = generate_urls(6, 3341)

    download_delay = 5

    def parse(self, res):
        if res.status == 200:
            filename = output_filename(res.url)
            with open(filename, 'wb') as fh:
                fh.write(res.body)
        else:
            print "ERROR", res.status, res.url
