# Simple Sync Strategy with Upstream Tailwind CSS

This document describes a simple, automated way to sync changes from Tailwind's complete N-API package while keeping our customizations.

## Overview

We maintain a **minimal diff** approach. Our changes are tiny and predictable, so we can automate the sync process.

## Our Complete Package Structure

We extract and customize **three complete crates** from Tailwind:

1. **`crates/oxide/`** → **`crates/sugarcube_scanner/`** (core scanner)
2. **`crates/classification-macros/`** → **`crates/sugarcube_scanner_macros/`** (macros)
3. **`crates/ignore/`** → **`crates/ignore/`** (gitignore handling)
4. **`crates/node/`** → **`crates/scanner/`** (N-API package with complete structure)

## Our Customizations (Only 6 Things!)

1. **Core crate name**: `tailwindcss-oxide` → `sugarcube_scanner`
2. **Macro crate name**: `classification-macros` → `sugarcube_scanner_macros` 
3. **N-API package branding**: `@tailwindcss/oxide` → `@sugarcube-org/scanner`
4. **Binary names**: `tailwindcss-oxide.*` → `scanner.*`
5. **Debug namespace**: `tailwindcss:oxide` → `sugarcube:scanner`
6. **Log files**: `tailwindcss-{}.log` → `sugarcube-{}.log`

That's it! Everything else stays exactly like Tailwind's code.

## Simple Sync Process

### 1. Automated Sync Script

Save this as `scripts/sync-upstream.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Starting sync with Tailwind CSS upstream..."

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

echo "📝 Reapplying our customizations..."

# 5. Automatically reapply our 4 simple changes
./scripts/apply-customizations.sh

# 6. Test the build
echo "🏗️ Testing build..."
if pnpm -r build; then
  echo "✅ Build successful! Review changes and merge with:"
  echo "   git checkout main && git merge sync/$DATE"
else
  echo "❌ Build failed. Check the changes manually."
fi

# 7. Cleanup
git remote rm temp-upstream || true
rm -rf temp-tailwind
```

### 2. Customizations Script

Save this as `scripts/apply-customizations.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Applying Sugarcube customizations..."

# 1. Update core crate names in Cargo.toml files
sed -i '' 's/name = "tailwindcss-oxide"/name = "sugarcube_scanner"/' crates/sugarcube_scanner/Cargo.toml
sed -i '' 's/name = "classification-macros"/name = "sugarcube_scanner_macros"/' crates/sugarcube_scanner_macros/Cargo.toml
sed -i '' 's/name = "tailwind-oxide"/name = "scanner"/' crates/scanner/Cargo.toml

# 2. Update dependencies between crates
sed -i '' 's/classification-macros/sugarcube_scanner_macros/g' crates/sugarcube_scanner/Cargo.toml
sed -i '' 's/tailwindcss-oxide/sugarcube_scanner/g' crates/scanner/Cargo.toml

# 3. Update all Rust imports in core scanner
find crates/sugarcube_scanner -name "*.rs" -exec sed -i '' 's/classification_macros/sugarcube_scanner_macros/g' {} \;
find crates/sugarcube_scanner -name "*.rs" -exec sed -i '' 's/tailwindcss_oxide/sugarcube_scanner/g' {} \;

# 4. Update N-API package imports
find crates/scanner/src -name "*.rs" -exec sed -i '' 's/tailwindcss_oxide/sugarcube_scanner/g' {} \;

# 5. Update debug namespace
sed -i '' 's/tailwindcss:oxide/sugarcube:scanner/g' crates/sugarcube_scanner/src/scanner/mod.rs
sed -i '' 's/tailwindcss-/sugarcube-/g' crates/sugarcube_scanner/src/scanner/mod.rs

# 6. Update N-API package branding
sed -i '' 's/@tailwindcss\/oxide/@sugarcube-org\/scanner/g' crates/scanner/package.json
sed -i '' 's/tailwindcss-oxide/scanner/g' crates/scanner/package.json

# 7. Update all platform-specific crates
find crates/scanner/npm -name "package.json" -exec sed -i '' 's/@tailwindcss\/oxide/@sugarcube-org\/scanner/g' {} \;
find crates/scanner/npm -name "package.json" -exec sed -i '' 's/tailwindcss-oxide/scanner/g' {} \;
find crates/scanner/npm -name "README.md" -exec sed -i '' 's/@tailwindcss\/oxide/@sugarcube-org\/scanner/g' {} \;

# 8. Update build scripts
sed -i '' 's/tailwindcss-oxide/scanner/g' crates/scanner/scripts/move-artifacts.mjs
sed -i '' 's/@tailwindcss\/oxide/@sugarcube-org\/scanner/g' crates/scanner/scripts/install.js

# 9. Update fuzz targets (if they exist)
if [ -d "crates/sugarcube_scanner/fuzz" ]; then
  find crates/sugarcube_scanner/fuzz -name "*.rs" -exec sed -i '' 's/tailwindcss_oxide/sugarcube_scanner/g' {} \;
  sed -i '' 's/name = "tailwindcss-oxide-fuzz"/name = "sugarcube-scanner-fuzz"/' crates/sugarcube_scanner/fuzz/Cargo.toml
  sed -i '' 's/\[dependencies\.tailwindcss-oxide\]/[dependencies.sugarcube_scanner]/' crates/sugarcube_scanner/fuzz/Cargo.toml
fi

echo "✅ Customizations applied successfully!"
```

### 3. Make Scripts Executable

```bash
chmod +x scripts/sync-upstream.sh
chmod +x scripts/apply-customizations.sh
```

## Usage

### To Sync with Upstream

```bash
# Run the sync (takes 2-3 minutes)
./scripts/sync-upstream.sh

# If build succeeds, merge the changes
git checkout main
git merge sync/2024-08-19  # (or whatever date)
git branch -d sync/2024-08-19
```

### When to Sync

- **Monthly**: Check for new Tailwind releases
- **Major releases**: Sync within 1-2 weeks  
- **Security fixes**: Sync immediately
- **Performance improvements**: Worth syncing for

## Why This Works

1. **Predictable changes**: Our customizations are always the same 4 simple find-and-replace operations
2. **Automated**: The scripts do all the work
3. **Safe**: Creates a branch so you can test before merging
4. **Fast**: Takes only a few minutes to run
5. **Reliable**: Uses git's built-in merge capabilities

## If Something Goes Wrong

1. **Build fails**: Check what changed in the new Tailwind code and update `apply-customizations.sh`
2. **Merge conflicts**: Use `git rerere` to remember resolutions for next time
3. **Bad sync**: Just delete the sync branch and try again

## Testing Your Sync

After syncing, always test:

1. **Core crates build**: `cd crates/sugarcube_scanner && cargo check`
2. **N-API package builds**: `cd crates/scanner && pnpm run build:platform`
3. **Native binary works**: `cd crates/scanner && node -e "console.log(require('./scanner.darwin-arm64.node'))"`
4. **All workspace builds**: `pnpm -r build` (if you have workspace build scripts)
5. **Verify customizations**: Check that package names, imports, and branding are correct

## What Changed from Simple Approach

- Now extracts **4 complete crates** instead of just 2
- Includes **complete N-API package** with all platform crates and scripts
- Handles **27 additional files** that need rebranding (platform crates, scripts)
- More comprehensive but still automated

This approach keeps you automatically synced with Tailwind's complete production-ready package structure while maintaining your branding with minimal effort!