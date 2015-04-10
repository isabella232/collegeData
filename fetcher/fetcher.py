import os
import re
import json
from scrapy import Spider

BASE = os.path.join(os.path.dirname(__file__), "..")
OUTPUT = os.path.join(BASE, "raw_html")
with open(os.path.join(BASE, "conf.json")) as fh:
    CONF = json.load(fh)


if not os.path.exists(OUTPUT):
    os.makedirs(OUTPUT)

def slugify_url(url):
    return re.sub("[^-a-zA-Z0-9_\.]", "-", url)

def wikipedia_slugify_title(title):
    return title.replace(" ", "_")

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

def wikipedia_urls():
    titles = [
        "List of historically black colleges and universities",
        "List of United States military schools and academies",
    ]
    urls = []
    for title in titles:
        url = "https://en.wikipedia.org/wiki/{}".format(wikipedia_slugify_title(title))
        if not os.path.exists(output_filename(url)):
            urls.append(url)
    return urls

def linkedin_urls():
    with open(os.path.join(BASE, "data", "linkedin.json")) as fh:
        data = json.load(fh)
        urls = []
        for key, result in data.iteritems():
            if not os.path.exists(output_filename(result['url'])):
                urls.append(result['url'])
        return urls

class CollegeSpider(Spider):
    name = "collegespider"

    start_urls = generate_urls(CONF['minSchoolId'], CONF['maxSchoolId']) + \
        wikipedia_urls() + \
        linkedin_urls()

    download_delay = CONF['throttle'] / 1000.

    def parse(self, res):
        if res.status == 200:
            filename = output_filename(res.url)
            with open(filename, 'wb') as fh:
                fh.write(res.body)
        else:
            print "ERROR", res.status, res.url
