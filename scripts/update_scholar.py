#!/usr/bin/env python3
import json
import sys
from pathlib import Path

try:
    from scholarly import scholarly
except Exception as exc:
    print("Scholarly is required. Run: pip install -r requirements.txt", file=sys.stderr)
    raise

try:
    from slugify import slugify
except Exception:
    def slugify(value: str) -> str:
        return "-".join("".join(c.lower() if c.isalnum() else " " for c in value).split())


AUTHOR_ID = "J9PoyoIAAAAJ"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PUBS_PATH = DATA_DIR / "publications.json"


def load_existing() -> list:
    if PUBS_PATH.exists():
        with PUBS_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return []


def normalize_pub(pub: dict) -> dict:
    bib = pub.get("bib", {})
    title = bib.get("title") or pub.get("container_type", "").strip()
    if not title:
        return None
    authors = ", ".join(bib.get("author", [])) if isinstance(bib.get("author"), list) else (bib.get("author") or "")
    venue = bib.get("venue") or bib.get("journal") or bib.get("pubvenue") or ""
    year = None
    y = bib.get("pub_year") or bib.get("year")
    try:
        year = int(y)
    except Exception:
        year = None

    links = {}
    eprint = bib.get("eprint") or pub.get("eprint_url")
    if eprint:
        links["pdf"] = eprint
    url = pub.get("pub_url") or pub.get("author_pub_url") or bib.get("url")
    if url:
        links.setdefault("project", url)

    return {
        "id": slugify(title),
        "title": title,
        "authors": authors,
        "venue": venue,
        "year": year,
        "links": links,
        "tags": []
    }


def merge_publications(existing: list, scraped: list) -> list:
    by_title = {p["title"].strip().lower(): p for p in existing}
    merged = []

    for p in scraped:
        key = p["title"].strip().lower()
        if key in by_title:
            old = by_title[key]
            # Merge links and tags, prefer scraped for core fields
            links = dict(old.get("links", {}))
            links.update(p.get("links", {}))
            tags = sorted(set((old.get("tags") or []) + (p.get("tags") or [])))
            merged.append({
                **old,
                **p,
                "links": links,
                "tags": tags,
                "id": old.get("id") or p.get("id")
            })
        else:
            merged.append(p)

    # Bring over any existing entries not present in scraped (e.g., legacy or manually added)
    scraped_titles = {p["title"].strip().lower() for p in scraped}
    for old in existing:
        if old["title"].strip().lower() not in scraped_titles:
            merged.append(old)

    # Sort: newest year desc, then title
    merged.sort(key=lambda p: (p.get("year") or -1, p.get("title") or ""), reverse=True)
    return merged


def main():
    existing = load_existing()
    print(f"Loaded {len(existing)} existing publications from {PUBS_PATH}")

    author = scholarly.search_author_id(AUTHOR_ID)
    author = scholarly.fill(author, sections=['publications'])
    pubs = author.get('publications', [])

    scraped = []
    for i, pub in enumerate(pubs):
        try:
            filled = scholarly.fill(pub)
            norm = normalize_pub(filled)
            if norm:
                scraped.append(norm)
        except Exception as exc:
            print(f"Warning: failed to fill pub {i}: {exc}")

    print(f"Scraped {len(scraped)} publications from Google Scholar")

    merged = merge_publications(existing, scraped)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with PUBS_PATH.open("w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(merged)} publications → {PUBS_PATH}")


if __name__ == "__main__":
    main()



