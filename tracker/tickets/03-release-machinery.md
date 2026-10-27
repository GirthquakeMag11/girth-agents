# 03: The release machinery — tag plus Release page

**Parent:** specs/plugin.md

**Kind:** feature

**Blocked by:** 01 (plugin skeleton and channel)

## What it delivers

The release path the spec settled: a release is a tag on the
repository, and each tag gets a GitHub Release page carrying the
changelog section, minus the old one-line install. `/cut-release`
re-scopes to do exactly that — version the queue, tag, publish the
Release page with the changelog notes — and no further.

## Acceptance criteria

- [ ] Cutting a release produces the tag and the GitHub Release page carrying the changelog section.
- [ ] Releases tag only from a green main.
- [ ] The old install line is gone from the Release body.
- [ ] `/cut-release` performs this and nothing broader.