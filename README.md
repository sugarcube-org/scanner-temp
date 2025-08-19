# Sugarcube Scanner

A high-performance CSS scanner and extractor, forked from Tailwind's oxide engine.

## Purpose

**For Rust developers**: This fork extracts Tailwind's production-proven CSS scanning engine (`tailwindcss-oxide`) as a standalone, reusable library. Tailwind's oxide is a highly optimized Rust crate that scans source files for CSS class candidates using fast regex patterns, gitignore-aware file walking, and efficient string processing. We've isolated this scanning logic from Tailwind's CSS generation pipeline to create a general-purpose utility for any CSS tooling that needs fast, accurate source file analysis.

## Project Requirements & Approach

**Requirements:**
- Extract Tailwind's CSS scanner as a standalone library while maintaining performance
- Preserve ability to sync with upstream Tailwind improvements (security, performance, bug fixes)
- Distribute as both Rust crate and Node.js package with cross-platform native binaries
- Minimize maintenance overhead through automation

**Current Approach:**
- **Fork Strategy**: git-filter-repo to extract 4 crates (`oxide`, `classification-macros`, `ignore`, `node`) with full commit history
- **Minimal Diff**: Only 6 simple find-replace customizations (crate names, package names, debug namespaces)
- **Automated Sync**: Shell scripts to fetch upstream, apply customizations, and test build
- **Monorepo Structure**: All crates in single repo for simplified dependency management

**Open Questions for Expert Review:**
- Is git-filter-repo + scripted customizations the optimal long-term sync strategy?
- Should we use git subtrees, submodules, or alternative approaches?
- How to handle potential upstream API changes that break our minimal diff approach?
- Best practices for maintaining N-API cross-platform distribution alongside Rust library?

## Architecture

This monorepo contains 4 complete crates extracted from Tailwind CSS:

### Core Packages
- **`sugarcube_scanner`** - Core Rust scanning engine (forked from `tailwindcss-oxide`)
- **`sugarcube_scanner_macros`** - Procedural macros for scanner functionality (forked from `classification-macros`)
- **`ignore`** - Gitignore-aware file walking utilities (forked from Tailwind's ignore crate)

### Distribution Package
- **`@sugarcube-org/scanner`** - Complete Node.js N-API package with:
  - Native binary distributions for all platforms (darwin-arm64, linux-x64-gnu, win32-x64-msvc, etc.)
  - WASM fallback for unsupported platforms
  - TypeScript definitions
  - Installation scripts and platform detection

## Quick Start

### Rust Usage
```bash
cd crates/sugarcube_scanner
cargo add sugarcube_scanner
```

```rust
use sugarcube_scanner::{Scanner, PublicSourceEntry};

let sources = vec![PublicSourceEntry {
    base: "./src".to_string(),
    pattern: "**/*.{js,jsx,ts,tsx}".to_string(),
    negated: false,
}];

let mut scanner = Scanner::new(sources);
let candidates = scanner.scan();
println!("Found CSS candidates: {:?}", candidates);
```

### Node.js Usage
```bash
npm install @sugarcube-org/scanner
```

```javascript
const { Scanner } = require('@sugarcube-org/scanner');

const scanner = new Scanner({
  sources: [{ 
    base: './src', 
    pattern: '**/*.{js,jsx,ts,tsx}', 
    negated: false 
  }]
});

const candidates = scanner.scan();
console.log('Found CSS candidates:', candidates);
```

## Development

### Prerequisites
- Rust 1.70+
- Node.js 16+
- pnpm 8+

### Build All Packages
```bash
# Install dependencies
pnpm install

# Build Rust crates
cd crates/sugarcube_scanner && cargo build --release

# Build N-API package (generates native binaries)
cd crates/scanner && pnpm run build:platform
```

### Testing
```bash
# Test core scanner
cd crates/sugarcube_scanner && cargo test

# Test N-API bindings
cd crates/scanner && node -e "console.log(require('./scanner.darwin-arm64.node'))"
```

## Fork Strategy

This is an independent fork that preserves Tailwind's commit history but maintains its own development path. We selectively cherry-pick important upstream improvements (security fixes, performance enhancements).

## Package Structure

```
crates/
├── sugarcube_scanner/          # Core scanning engine
├── sugarcube_scanner_macros/   # Procedural macros
├── ignore/                     # Gitignore utilities
└── scanner/                    # N-API package
    ├── src/                    # Rust N-API bindings
    ├── npm/                    # Platform-specific packages
    │   ├── darwin-arm64/
    │   ├── linux-x64-gnu/
    │   └── ...
    └── scripts/                # Build and install scripts
```

## License

MIT License. Portions derived from Tailwind CSS (Tailwind Labs, Inc.).