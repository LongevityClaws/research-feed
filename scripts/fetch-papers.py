#!/usr/bin/env python3
"""Fetch today's longevity papers from PubMed, arXiv, bioRxiv.
Score and summarise with Claude, output data/latest.json.
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from pathlib import Path

# ── config ──────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
AUTH_PROFILES = Path.home() / ".openclaw/agents/main/agent/auth-profiles.json"

PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
ARXIV_API = "http://export.arxiv.org/api/query"
BIORXIV_API = "https://api.biorxiv.org/details/biorxiv"

SEARCH_TERMS = (
    "(epigenetic clock OR biological aging OR senolytics OR senolytic "
    "OR partial reprogramming OR yamanaka factors OR gene therapy aging "
    "OR longevity gene)"
)

RELEVANCE_CATEGORIES = [
    "senolytics", "epigenetic_clocks", "partial_reprogramming",
    "gene_therapy", "pet_longevity",
]

MAX_PAPERS = 10


def get_llm_config() -> dict:
    """Return LLM config dict with provider/key/model. Tries Anthropic first, OpenRouter fallback."""
    # Check env first
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return {"provider": "anthropic", "key": key, "model": "claude-sonnet-4-20250514"}

    if not AUTH_PROFILES.exists():
        print("ERROR: No API keys found.", file=sys.stderr)
        sys.exit(1)

    profiles = json.loads(AUTH_PROFILES.read_text())
    all_profiles = profiles.get("profiles", {})

    # Try Anthropic keys
    last_good = profiles.get("lastGood", {}).get("anthropic", "anthropic:default")
    for profile_name in [last_good, "anthropic:default"]:
        key = all_profiles.get(profile_name, {}).get("token")
        if key:
            # Quick auth check
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=key)
                client.messages.create(model="claude-sonnet-4-20250514", max_tokens=5,
                                       messages=[{"role": "user", "content": "hi"}])
                return {"provider": "anthropic", "key": key, "model": "claude-sonnet-4-20250514"}
            except Exception:
                continue

    # Fallback: OpenRouter
    or_key = all_profiles.get("openrouter:default", {}).get("key")
    if or_key:
        return {"provider": "openrouter", "key": or_key, "model": "anthropic/claude-sonnet-4"}

    print("ERROR: No working API keys found.", file=sys.stderr)
    sys.exit(1)


# ── PubMed ──────────────────────────────────────────────────────────────────

def fetch_pubmed(date_str: str) -> list[dict]:
    """Search PubMed and return raw paper dicts."""
    params = urllib.parse.urlencode({
        "db": "pubmed",
        "term": SEARCH_TERMS,
        "retmax": 20,
        "sort": "date",
        "retmode": "json",
        "mindate": date_str.replace("-", "/"),
        "maxdate": date_str.replace("-", "/"),
        "datetype": "edat",
    })
    url = f"{PUBMED_SEARCH}?{params}"
    print(f"  PubMed search: {url[:120]}...")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  PubMed search failed: {e}")
        return []

    ids = data.get("esearchresult", {}).get("idlist", [])
    if not ids:
        # Try broader window: yesterday too
        yesterday = (datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y/%m/%d")
        params2 = urllib.parse.urlencode({
            "db": "pubmed",
            "term": SEARCH_TERMS,
            "retmax": 20,
            "sort": "date",
            "retmode": "json",
            "mindate": yesterday,
            "maxdate": date_str.replace("-", "/"),
            "datetype": "edat",
        })
        url2 = f"{PUBMED_SEARCH}?{params2}"
        print(f"  PubMed retry with wider window...")
        try:
            with urllib.request.urlopen(url2, timeout=30) as resp:
                data = json.loads(resp.read())
            ids = data.get("esearchresult", {}).get("idlist", [])
        except Exception as e:
            print(f"  PubMed retry failed: {e}")
            return []

    if not ids:
        print("  PubMed: no results")
        return []

    print(f"  PubMed: {len(ids)} IDs found, fetching abstracts...")
    fetch_params = urllib.parse.urlencode({
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "xml",
    })
    fetch_url = f"{PUBMED_FETCH}?{fetch_params}"
    try:
        with urllib.request.urlopen(fetch_url, timeout=30) as resp:
            xml_data = resp.read()
    except Exception as e:
        print(f"  PubMed fetch failed: {e}")
        return []

    root = ET.fromstring(xml_data)
    papers = []
    for article in root.findall(".//PubmedArticle"):
        title_el = article.find(".//ArticleTitle")
        abstract_el = article.find(".//AbstractText")
        pmid_el = article.find(".//PMID")
        doi_el = article.find(".//ArticleId[@IdType='doi']")

        title = title_el.text if title_el is not None and title_el.text else ""
        abstract = abstract_el.text if abstract_el is not None and abstract_el.text else ""
        pmid = pmid_el.text if pmid_el is not None else ""
        doi = doi_el.text if doi_el is not None else ""

        url = f"https://doi.org/{doi}" if doi else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        if title:
            papers.append({
                "title": title.strip(),
                "abstract": abstract.strip(),
                "source": "pubmed",
                "url": url,
            })
    print(f"  PubMed: {len(papers)} papers parsed")
    return papers


# ── arXiv ───────────────────────────────────────────────────────────────────

def fetch_arxiv() -> list[dict]:
    """Search arXiv for recent longevity papers."""
    params = urllib.parse.urlencode({
        "search_query": "all:aging+longevity+senolytics",
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": 10,
    })
    url = f"{ARXIV_API}?{params}"
    print(f"  arXiv search...")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            xml_data = resp.read()
    except Exception as e:
        print(f"  arXiv failed: {e}")
        return []

    root = ET.fromstring(xml_data)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    papers = []
    for entry in root.findall("atom:entry", ns):
        title = entry.find("atom:title", ns)
        summary = entry.find("atom:summary", ns)
        link = entry.find("atom:id", ns)
        if title is not None and title.text:
            papers.append({
                "title": " ".join(title.text.split()).strip(),
                "abstract": summary.text.strip() if summary is not None and summary.text else "",
                "source": "arxiv",
                "url": link.text.strip() if link is not None and link.text else "",
            })
    print(f"  arXiv: {len(papers)} papers")
    return papers


# ── bioRxiv ─────────────────────────────────────────────────────────────────

def fetch_biorxiv(date_str: str) -> list[dict]:
    """Fetch bioRxiv papers for a given date."""
    url = f"{BIORXIV_API}/{date_str}/{date_str}/json"
    print(f"  bioRxiv: {url}")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  bioRxiv failed: {e}")
        return []

    collection = data.get("collection", [])
    # Filter for aging-related keywords
    keywords = ["aging", "ageing", "senesc", "senolytic", "epigenetic clock",
                 "longevity", "reprogramming", "yamanaka", "gene therapy"]
    papers = []
    for item in collection:
        title = item.get("title", "")
        abstract = item.get("abstract", "")
        text = (title + " " + abstract).lower()
        if any(kw in text for kw in keywords):
            doi = item.get("doi", "")
            papers.append({
                "title": title.strip(),
                "abstract": abstract.strip(),
                "source": "biorxiv",
                "url": f"https://doi.org/{doi}" if doi else "",
            })
    print(f"  bioRxiv: {len(papers)} relevant (of {len(collection)} total)")
    return papers


# ── Claude scoring ──────────────────────────────────────────────────────────

SCORING_PROMPT = """You are a longevity research analyst. For each paper below, provide:
1. A relevance score (1-5):
   - 5: direct breakthrough in core areas (reprogramming, senolytics, gene therapy)
   - 4: strong evidence, significant mechanism discovery
   - 3: relevant but incremental
   - 2: tangentially related
   - 1: not relevant to longevity science
2. A 2-3 sentence plain-English summary of the key finding and why it matters for longevity
3. A relevance category from: senolytics, epigenetic_clocks, partial_reprogramming, gene_therapy, pet_longevity

Return ONLY valid JSON — an array of objects with keys: title, score, summary, relevance.
Do NOT wrap in markdown code fences. Just the raw JSON array.

Papers:
"""


def call_llm(llm_config: dict, prompt: str) -> str:
    """Call LLM via Anthropic SDK or OpenRouter HTTP, return response text."""
    provider = llm_config["provider"]

    if provider == "anthropic":
        import anthropic
        client = anthropic.Anthropic(api_key=llm_config["key"])
        msg = client.messages.create(
            model=llm_config["model"],
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()

    elif provider == "openrouter":
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps({
                "model": llm_config["model"],
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}],
            }).encode(),
            headers={
                "Authorization": f"Bearer {llm_config['key']}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://longevitydigest.com",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"].strip()

    raise ValueError(f"Unknown provider: {provider}")


def score_papers(papers: list[dict], llm_config: dict) -> list[dict]:
    """Use Claude to score and summarise papers."""
    if not papers:
        return []

    # Build paper text for the prompt
    paper_texts = []
    for i, p in enumerate(papers):
        paper_texts.append(
            f"[{i+1}] Title: {p['title']}\n"
            f"    Source: {p['source']}\n"
            f"    Abstract: {p['abstract'][:800]}"
        )
    prompt_body = SCORING_PROMPT + "\n".join(paper_texts)

    print(f"  Scoring {len(papers)} papers with {llm_config['provider']}...")
    try:
        raw = call_llm(llm_config, prompt_body)
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[:-3]
        scored = json.loads(raw)
    except Exception as e:
        print(f"  LLM scoring failed: {e}", file=sys.stderr)
        return []

    # Merge scores back into paper dicts
    results = []
    for i, p in enumerate(papers):
        if i < len(scored):
            s = scored[i]
            results.append({
                "title": p["title"],
                "source": p["source"],
                "url": p["url"],
                "summary": s.get("summary", ""),
                "relevance": s.get("relevance", ""),
                "score": int(s.get("score", 1)),
            })
    return results


# ── main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Fetch longevity papers")
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"),
                        help="Date to fetch (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print results instead of writing file")
    args = parser.parse_args()

    date_str = args.date
    print(f"Fetching longevity papers for {date_str}...")

    llm_config = get_llm_config()
    print(f"Using LLM: {llm_config['provider']} / {llm_config['model']}")

    # Fetch from all sources
    all_papers = []
    all_papers.extend(fetch_pubmed(date_str))
    time.sleep(0.5)  # be polite to APIs
    all_papers.extend(fetch_arxiv())
    time.sleep(0.5)
    all_papers.extend(fetch_biorxiv(date_str))

    if not all_papers:
        print("No papers found from any source.")
        sys.exit(0)

    print(f"\nTotal raw papers: {len(all_papers)}")

    # Score with Claude
    scored = score_papers(all_papers, llm_config)

    # Filter score >= 3, sort descending, take top MAX_PAPERS
    filtered = [p for p in scored if p["score"] >= 3]
    filtered.sort(key=lambda x: x["score"], reverse=True)
    filtered = filtered[:MAX_PAPERS]

    print(f"Papers after filtering (score >= 3): {len(filtered)}")

    output = {
        "date": date_str,
        "generated_by": "pipeline",
        "papers": filtered,
    }

    if args.dry_run:
        print(json.dumps(output, indent=2))
    else:
        out_path = REPO_ROOT / "data" / "latest.json"
        out_path.write_text(json.dumps(output, indent=2) + "\n")
        print(f"\nWrote {len(filtered)} papers to {out_path}")

    return len(filtered)


if __name__ == "__main__":
    count = main()
    sys.exit(0 if count > 0 else 0)
