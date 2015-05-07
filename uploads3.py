#!/usr/bin/env python

import os
import json
from boto.s3.connection import S3Connection
from boto.s3.key import Key

with open(os.path.join(os.path.dirname(__file__), "conf.json")) as fh:
    CONF = json.load(fh)

IMAGE_BASE = os.path.join(os.path.dirname(__file__), "images")

def main():
    conn = S3Connection(CONF['aws_access_key_id'], conf['aws_secret_access_key'])
    bucket = conn.get_bucket(CONF['aws_bucket'])
    for filename in os.listdir(IMAGE_BASE):
        path = os.path.join(IMAGE_BASE, filename)
        if os.path.splitext(path)[1] in (".png", ".jpg", ".gif"):
            k = Key(bucket)
            k.key = filename
            k.set_contents_from_filename(path)

if __name__ == "__main__":
    main()
