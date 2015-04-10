# collegeData

Scrape all the things.

To run, run ``run.js``.  This will do the following, in order:

 - execute fetcher/bootstrap-python.sh, installing python deps
 - execute fetcher/run-scraper.sh, downloading source html to ``raw_html/``.
 - check if any files have changed.  If they have:
    - execute parseFilesFromDisk.js
    - execute parseSchoolTypes.js
    - execute parseImages.js
 - merge all data together into the parsed JSON files in out/

