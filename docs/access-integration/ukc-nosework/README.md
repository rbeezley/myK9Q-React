# UKC Nosework - myK9Q Module

VBA module for syncing UKC Nosework trial data with myK9Q via Supabase.

## Files

| File | Purpose |
|------|---------|
| `mod_myK9Qv3.bas` | **Production** - New v3 module (to be created) |
| `mod_myK9Q_legacy.bas` | **Reference only** - Old module for field mapping reference |

## Status

**In Progress** - Converting from legacy module to v3 architecture.

## Conversion Notes

The v3 module will be based on the AKC Scent Work template with UKC-specific adjustments.

### Key Differences from AKC

| Aspect | UKC Legacy | AKC v3 (target) |
|--------|------------|-----------------|
| **API Method** | ODBC linked tables | REST API |
| **Supabase Project** | `ggreahsjqzombkvagxle` (old) | `yyzgjyiqgmjzyhzkqdfx` (v3) |
| **Tables** | `public_tbl_*_queue` | `shows`, `trials`, `classes`, `entries` |
| **Organization** | `"UKC Nosework"` | `"AKC Scent Work"` |
| **Class Division** | `Division` field | `Section` field |
| **Time Limits** | Single `time_limit` | 3 area-specific limits |

### UKC Levels
Novice, Advanced, Superior, Excellent, Master, Elite

### Conversion Checklist
- [ ] Copy AKC module as base
- [ ] Change organization to `"UKC Nosework"`
- [ ] Adjust field mappings (Division → Section)
- [ ] Verify UKC levels match database
- [ ] Keep single time limit (UKC doesn't use multi-area)
- [ ] Test upload/download cycle
- [ ] Test scored entry protection

## See Also

- [AKC Scent Work module](../akc-scent-work/) - Template for v3 architecture
- [Access Integration Overview](../README.md) - Common patterns
