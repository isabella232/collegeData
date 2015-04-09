#!/bin/bash

# Path to directory's script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ ! -d venv ]; then
    virtualenv venv
fi
source venv/bin/activate
pip install -r requirements.txt
