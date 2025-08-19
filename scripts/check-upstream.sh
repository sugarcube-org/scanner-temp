#!/bin/bash
# Check for upstream changes in Tailwind CSS components

git fetch upstream 2>/dev/null || {
    echo "⚠️  Upstream remote not found. Setting up..."
    git remote add upstream https://github.com/tailwindlabs/tailwindcss.git
    git fetch upstream
}

echo "🔍 Recent changes in Tailwind's scanning components:"
echo

echo "Oxide (core scanner):"
git log --oneline --since="3 months ago" upstream/main -- crates/oxide/ || echo "No recent changes"
echo

echo "Classification Macros:"  
git log --oneline --since="3 months ago" upstream/main -- crates/classification-macros/ || echo "No recent changes"
echo

echo "Ignore utilities:"
git log --oneline --since="3 months ago" upstream/main -- crates/ignore/ || echo "No recent changes"
echo

echo "Node package:"
git log --oneline --since="3 months ago" upstream/main -- crates/node/ || echo "No recent changes"
echo

echo "💡 To review a specific change:"
echo "   git show <commit-hash>"
echo
echo "💡 To cherry-pick a change:"
echo "   git cherry-pick <commit-hash>"