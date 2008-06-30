echo "Minifying javascript..."
cat processing.js sparklines.js | python scripts/jsmin.py > sparklines.min.js
echo "Javascript minified."
echo "Done.  Saved as 'sparklines.min.js' in pwd."