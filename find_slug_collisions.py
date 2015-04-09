import os
import re
from collections import defaultdict
import json

slugs = defaultdict(list)

def slugify(*parts):
    return re.sub('[^-a-z0-9]+', '-', " ".join(parts).lower())

for filename in os.listdir("data"):
    with open(os.path.join("data", filename)) as fh:
        data = json.load(fh)
        if data['name']:
            citystate = data['citystate']
            if citystate:
                city, state = citystate.rsplit(', ', 1)
                slug = slugify(data['name'], state)
            else:
                slug = slugify(data['name'])
            slugs[slug].append(data)

for slug, schools in slugs.iteritems():
    if len(schools) > 1:
        print slug
        for school in schools:
            print "  ", school['idNumber'], school['name'], school['citystate']
