#!/bin/bash

# Path to directory's script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

$DIR/venv/bin/scrapy runspider fetcher.py
