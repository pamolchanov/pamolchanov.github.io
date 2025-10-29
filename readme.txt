How to preview
Open /Users/pmolchanov/webpage/index.html directly, or run:

cd /Users/pmolchanov/webpage
python3 -m http.server 8080

How to update publications
cd /Users/pmolchanov/webpage
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 scripts/update_scholar.py

How to edit content
News: add entries to data/news.json:
{ "date": "2025-08-10", "title": "New paper accepted to NeurIPS!", "link": "https://..." }
Featured: keep ids in data/featured.json (ids are slugs of titles in data/publications.json).
Publications: usually managed by the Scholar updater; you can still add or tweak entries manually.
Style inspiration
Layout and structure take cues from:
pmolchanov.com for content and sections pmolchanov.com
Clean, card-based sections and simplicity similar to stulyakov.com
Academic, minimal presentation similar to hongxu-yin.github.io
Publications are synced from Google Scholar: Scholar profile
Next tweaks I can make (optional)
Add an “About”/bio section pulled from a data/profile.json.
Add tags/filters for research areas beyond venue/year.
Add links to CV, GitHub, X, and talk videos.
Added new site files under /Users/pmolchanov/webpage, set up JSON-driven content, and fetched the latest publications from the Scholar profile.