#!/usr/bin/env python
from __future__ import print_function, division
import re
import os
import json
import glob
import argparse
import pprint
from collections import Counter

def load_all():
    data = []
    for filename in glob.glob(os.path.join(os.path.dirname(__file__), "..", "out", "*.json")):
        with open(filename) as fh:
            data.append(json.load(fh))
    return data

def dot_get(obj, path):
    parts = path.split(".")
    for part in parts:
        if re.match("\d+", part):
            part = int(part)
        try:
            obj = obj[part]
        except (IndexError, KeyError):
            return None
    return obj

def count_values(path):
    data = load_all()
    values = []
    for d in data:
        values.append(dot_get(d, path))
    counter = Counter(values)
    for val, count in counter.iteritems():
        print(val, ":", count, "({:0.1f}%)".format(count / len(data) * 100))

def count_nulls(path):
    data = load_all()
    is_null = 0
    for d in data:
        if dot_get(d, path) is None:
            is_null += 1
    print(path, "null", is_null, "({:0.1f}%)".format(is_null / len(data) * 100))

if __name__ == "__main__":
    parser = argparse.ArgumentParser("Explore json")
    parser.add_argument("command", choices=["values", "nulls"])
    parser.add_argument("arg")
    args = parser.parse_args()
    if args.command == "values":
        count_values(args.arg)
    elif args.command == "nulls":
        count_nulls(args.arg)

