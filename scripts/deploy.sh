#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DATE="${1:-$(date -u +%Y-%m-%d)}"

cd "$REPO_DIR"

echo "=== Longevity Digest Pipeline ==="
echo "Date: $DATE"
echo ""

# 1. Fetch papers
echo ">> Fetching papers..."
python3 "$SCRIPT_DIR/fetch-papers.py" --date "$DATE"

# 2. Check if anything changed
if git diff --quiet data/latest.json data/seen-items.json 2>/dev/null; then
    echo ">> No new papers — nothing to deploy."
    exit 0
fi

# 3. Commit
echo ""
echo ">> Committing..."
git add data/latest.json data/seen-items.json
git commit -m "papers: $DATE"

# 4. Push
echo ">> Pushing..."
git push

# 5. Deploy
echo ">> Deploying to Vercel..."
vercel --prod --yes

# 6. Send digest emails
echo ""
echo ">> Sending digest emails..."
npx tsx "$SCRIPT_DIR/send-digest-email.ts"

echo ""
echo "=== Done ==="
