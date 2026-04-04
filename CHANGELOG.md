# Changelog

All notable changes to **Parallax-Nu** will be documented in this file.

The format is loosely based on *Keep a Changelog*, with entries grouped by release rather than by commit.

## [Unreleased]

### Planned
- 

## [0.8.2] - 2026-04-04


### Added
- Top-bar Parallax logo beside the native Planets.nu logo
- Account navigation entry for opening Parallax settings
- Tabbed configuration modal
- About tab with build/version display area
- Development loader workflow improvements for faster iteration

### Changed
- Removed the large injected config panel that disrupted page layout
- Moved the config modal to a top-aligned presentation for more stable tab positioning
- Improved modal presentation with faster, smoother tab and resize behavior

### Planned
- Generated build metadata for the About tab
- Recent patch notes display sourced from release history
- Audio, social, and rendering settings expansion
- Better release automation for production builds

## [0.8.1] - 2026-04-04

### Added
- Initial Parallax configuration UI
- Local config persistence support
- Top-bar branding integration
- About tab foundation

### Changed
- Improved dev-loader-oriented development workflow
- Refined configuration entry points from menu/navigation rather than a large embedded panel

---

## Release Notes Policy

- Add changes to **[Unreleased]** as work progresses.
- When publishing a release:
  - move relevant items from **[Unreleased]** into a new versioned section
  - assign the release version and date
  - keep entries concise and user-facing where possible
- Avoid listing every internal commit unless it matters to users or contributors
