# Product Guidelines - myK9Q

## 1.0 Design Philosophy
- **Visual Aesthetic:** Modern, Apple-inspired interface characterized by clean lines, high contrast, subtle shadows, and sophisticated typography. The design should feel native, polished, and trustworthy.
- **Layout Principles:**
    - **Clarity over Density:** Prioritize clear, readable content with generous whitespace, especially for scoring interfaces used on mobile devices.
    - **Touch-Optimized:** All interactive elements must have a minimum touch target size of 44x44px to accommodate ring-side usage.
    - **Consistent Navigation:** Use standard platform patterns (e.g., bottom navigation on mobile, side navigation on desktop) to reduce cognitive load.

## 2.0 Tone & Voice
- **Professional & Precise:** Communication should be clear, technical, and direct. The language must reflect the seriousness of competitive dog show scoring.
- **Terminology:** Strictly adhere to official organization rulebooks (AKC, UKC, ASCA) for all domain-specific terms (e.g., "Faults," "Qualifying Score," "NQ").
- **Error Messages:** Constructive and specific. Explain exactly what went wrong and how to fix it without blaming the user.

## 3.0 Interaction Guidelines
- **Haptic Feedback:** Utilize subtle vibrations to confirm critical actions like saving a score or recording a fault, providing tactile reassurance in noisy environments.
- **Visual Status Indicators:**
    - **Connectivity:** Prominently display network status (Online/Offline/Syncing) using color-coded badges or banners.
    - **Sync State:** Use non-intrusive spinners or progress bars to indicate background synchronization.
- **Safety:** Implement confirmation steps or "undo" toasts for destructive actions like deleting an entry or finalizing a class.

## 4.0 Accessibility & Inclusion
- **Contrast Ratios:** Ensure all text and interactive elements meet WCAG AA standards for legibility in bright outdoor environments or dimly lit indoor arenas.
- **Color Independence:** Do not rely solely on color to convey status (e.g., use icons + color for "Qualified" vs. "Non-Qualified").
