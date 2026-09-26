#!/usr/bin/env bash
# Collects the site files into dist/ for Cloudflare Workers static assets.
set -euo pipefail
rm -rf dist
mkdir -p dist
cp *.html style.css layout.js script.js content.json favicon.png dist/
cp -R images media dist/
find dist -name .DS_Store -delete
echo "dist ready: $(find dist -type f | wc -l | tr -d ' ') files"
