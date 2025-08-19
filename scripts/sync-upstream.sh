#!/bin/bash
set -e

echo "Starting sync with Tailwind CSS upstream..."

# 1. Get latest Tailwind code
rm -rf temp-tailwind
git clone https://github.com/tailwindlabs/tailwindcss.git temp-tailwind
cd temp-tailwind

# 2. Extract just the parts we need with history
git filter-repo \
  --path crates/oxide/ \
  --path crates/classification-macros/ \
  --path crates/ignore/ \
  --path crates/node/ \
  --path-rename crates/oxide/:crates/sugarcube_scanner/ \
  --path-rename crates/classification-macros/:crates/sugarcube_scanner_macros/ \
  --path-rename crates/ignore/:crates/ignore/ \
  --path-rename crates/node/:crates/scanner/ \
  --force

# 3. Apply to our repo
cd ..
git remote add temp-upstream temp-tailwind || true
git fetch temp-upstream

# 4. Create sync branch and merge
DATE=$(date +%Y-%m-%d)
git checkout -b "sync/$DATE"
git merge temp-upstream/main --allow-unrelated-histories

echo "Reapplying our customizations..."

# 5. Automatically reapply our 4 simple changes
./scripts/apply-customizations.sh

# 6. Test the build
echo "🏗️ Testing build..."
if pnpm -r build; then
  echo "Build successful! Review changes and merge with:"
  echo "   git checkout main && git merge sync/$DATE"
else
  echo "Build failed. Check the changes manually."
fi

# 7. Cleanup
git remote rm temp-upstream || true
rm -rf temp-tailwind