#!/bin/bash
set -e

echo "Applying sugarcube customizations..."

# 1. Update crate names in Cargo.toml files
sed -i '' 's/name = "tailwindcss-oxide"/name = "sugarcube_scanner"/' crates/sugarcube_scanner/Cargo.toml
sed -i '' 's/name = "classification-macros"/name = "sugarcube_scanner_macros"/' crates/sugarcube_scanner_macros/Cargo.toml

# 2. Update dependencies
sed -i '' 's/classification-macros/sugarcube_scanner_macros/g' crates/sugarcube_scanner/Cargo.toml

# 3. Update all Rust imports
find crates/sugarcube_scanner -name "*.rs" -exec sed -i '' 's/classification_macros/sugarcube_scanner_macros/g' {} \;
find crates/sugarcube_scanner -name "*.rs" -exec sed -i '' 's/tailwindcss_oxide/sugarcube_scanner/g' {} \;

# 4. Update debug namespace
sed -i '' 's/tailwindcss:oxide/sugarcube:scanner/g' crates/sugarcube_scanner/src/scanner/mod.rs
sed -i '' 's/tailwindcss-/sugarcube-/g' crates/sugarcube_scanner/src/scanner/mod.rs

# 5. Update fuzz targets
find crates/sugarcube_scanner/fuzz -name "*.rs" -exec sed -i '' 's/tailwindcss_oxide/sugarcube_scanner/g' {} \;
sed -i '' 's/name = "tailwindcss-oxide-fuzz"/name = "sugarcube-scanner-fuzz"/' crates/sugarcube_scanner/fuzz/Cargo.toml
sed -i '' 's/\[dependencies\.tailwindcss-oxide\]/[dependencies.sugarcube_scanner]/' crates/sugarcube_scanner/fuzz/Cargo.toml

echo "Customizations applied successfully!"