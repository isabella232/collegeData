import os
import re
import json

majors = set()

for filename in os.listdir("data"):
    with open(os.path.join("data", filename)) as fh:
        if filename.endswith(".json"):
            data = json.load(fh)
            for maj in data['undergraduateMajors']:
                majors.add(maj)

print json.dumps({"majors": list(majors)}, indent=0)
