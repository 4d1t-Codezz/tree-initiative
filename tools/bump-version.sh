#!/bin/sh
# Stamp a fresh ?v= on CSS, JS and video URLs in index.html so browsers
# fetch new files after each deploy (GitHub Pages caches files for 10 minutes).
# Usage: sh tools/bump-version.sh   (run from the repo root before committing)
v=$(date +%Y%m%d%H%M%S)
perl -pi -e "s{((?:styles\.css|main\.js|config\.js|assets/video/[\w-]+\.(?:mp4|jpg)))(\?v=\w+)?\"}{\$1?v=$v\"}g" index.html
echo "version $v"
