# Security review: optimize the authority path, not the appearance of protection

The public fast path reduced isolated guard cost by removing state IO. Public bytes remain inspectable; client anti-export hooks are deterrence, not confidentiality. The largest risk found by broad tests was an older signed bridge branch before account authorization. A secret embedded in source and a convenient external upstream fallback made the exceptional path stronger than the real account boundary. Removing the branch was more valuable than adding another browser signal.

Verification failure, invalid proof and unknown outcome must be different states. Explicit attempt identity and durable submission intent prevent refresh/double-click/network retry from becoming either punishment or duplicated work. Manual false-positive recovery clears a specific reviewed incident; investigation tokens remain a distinct temporary exception without account authority.

A green local test does not certify its provider, topology, field UX or dependency vulnerability status. Keep those gates visible. The host denied external npm audit metadata egress; no alternate registry lookup or bypass was attempted. Native browser control requested host permission, so no new responsive screenshot or full UI acceptance is claimed.
