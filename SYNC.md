# Upstream Monitoring Strategy

This document describes how to monitor and selectively integrate changes from upstream Tailwind CSS.

## Philosophy

Rather than automated syncing (which proved complex and brittle), we maintain an independent fork and selectively cherry-pick valuable upstream improvements. This gives us:

- **Full control** over what changes we accept
- **Stable codebase** without unexpected breaking changes  
- **Clean history** without complex merge conflicts
- **Focused improvements** - only take what benefits our use case

## Monitoring Upstream Changes

### 1. Setup Upstream Remote

```bash
# Add Tailwind as upstream remote (one-time setup)
git remote add upstream https://github.com/tailwindlabs/tailwindcss.git
```

### 2. Check for Updates

Run this monthly or when you hear about important Tailwind releases:

```bash
#!/bin/bash
# scripts/check-upstream.sh
git fetch upstream

echo "🔍 Recent changes in Tailwind's scanning components:"
echo
echo "Oxide (core scanner):"
git log --oneline --since="3 months ago" upstream/main -- crates/oxide/
echo
echo "Classification Macros:"  
git log --oneline --since="3 months ago" upstream/main -- crates/classification-macros/
echo
echo "Ignore utilities:"
git log --oneline --since="3 months ago" upstream/main -- crates/ignore/
echo
echo "Node package:"
git log --oneline --since="3 months ago" upstream/main -- crates/node/
```

## When to Cherry-Pick Changes

### ✅ **Good Candidates for Cherry-Picking:**
- **Security fixes** in the scanning engine
- **Performance improvements** to file processing or regex matching
- **Bug fixes** that affect scanning accuracy
- **New CSS selector support** that's relevant to your use case

### ❌ **Skip These Changes:**
- Tailwind-specific CSS generation features
- Breaking API changes that don't benefit standalone scanning
- Complex refactoring without clear performance/security benefits
- Changes to Tailwind's build pipeline or documentation

## How to Cherry-Pick Changes

### 1. Review the Change
```bash
# Look at a specific commit
git show <commit-hash>

# See what files it affects
git show --name-only <commit-hash>
```

### 2. Cherry-Pick if Beneficial
```bash
# Apply the specific commit
git cherry-pick <commit-hash>

# If conflicts occur, resolve manually
git status
# Fix conflicts...
git add .
git cherry-pick --continue
```

### 3. Test the Change
```bash
# Test core scanner builds
cd crates/sugarcube_scanner && cargo test

# Test N-API package builds  
cd crates/scanner && pnpm run build:platform

# Test that branding is still correct
cd crates/scanner && node -e "console.log(require('./scanner.darwin-arm64.node'))"
```

### 4. Update Version and Commit
```bash
# Update version in relevant Cargo.toml and package.json files
# Commit with descriptive message
git commit -m "Cherry-pick: Improve CSS scanning performance

Applies upstream Tailwind commit abc1234:
- Optimize regex patterns for class name detection
- Reduce memory allocations in file processing

Original commit: https://github.com/tailwindlabs/tailwindcss/commit/abc1234"
```

## Example Workflow

```bash
# Monthly upstream check
./scripts/check-upstream.sh

# Found an interesting security fix in oxide
git show upstream/main:crates/oxide/src/scanner/mod.rs

# Looks good, cherry-pick it
git cherry-pick abc1234

# Test everything still works
cargo test
pnpm run build:platform

# Update changelog and version
git add .
git commit -m "Security fix: Prevent path traversal in file scanning"
```

## Advantages of This Approach

1. **Predictable** - You control exactly what changes are applied
2. **Stable** - No surprise breaking changes from automated merges  
3. **Focused** - Only get improvements that benefit your specific use case
4. **Maintainable** - Simple git operations, no complex scripts to maintain
5. **Reviewable** - Each upstream change is individually reviewed and tested

## When NOT to Cherry-Pick

Sometimes it's better to implement improvements independently:

- If a Tailwind change is heavily coupled to their CSS generation
- If their approach doesn't fit your architecture
- If the change introduces dependencies you don't want

In these cases, consider implementing a similar improvement in your own style rather than trying to adapt their exact solution.

---

This approach has proven successful for many long-term forks in the Rust ecosystem and gives you the best balance of staying current with improvements while maintaining independence.