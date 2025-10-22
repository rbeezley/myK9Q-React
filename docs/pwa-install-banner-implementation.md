# PWA Install Banner Implementation

## Date: 2025-01-21

## Overview
Implemented a beautiful PWA install banner for exhibitor users with favorited dogs, encouraging them to install the app to receive notifications.

## Features Implemented

### 1. **Install Banner Component**
- **File**: [src/components/ui/InstallPrompt.tsx](../src/components/ui/InstallPrompt.tsx)
- **Location**: Displays at the top of the Home page for exhibitors
- **Design**: Teal → Purple → Blue gradient matching the login page aesthetic
- **Conditions**: Only shows when:
  - User role is "exhibitor"
  - User has favorited 2+ dogs
  - Notifications are enabled in settings
  - App is not already installed
  - User hasn't dismissed the prompt (7-day cooldown)

### 2. **Gradient Styling**
- **Colors**:
  - Teal: `#0ea5e9`
  - Purple: `#8b5cf6`
  - Indigo: `#6366f1`
  - Blue: `#3b82f6`
- **Gradient**: `linear-gradient(90deg, #0ea5e9 0%, #8b5cf6 40%, #6366f1 70%, #3b82f6 100%)`
- **Shadow**: Dual-layer shadow with teal and purple glows
- **Border Radius**: 12px for modern look

### 3. **Browser-Specific Instructions**
The "Install" button shows different instructions based on browser:

**Chrome**:
```
1. Click the three dots menu (⋮) in the top-right corner
2. Select "Save and Share" → "Install app"
   OR look for an install icon (⊕) in the address bar
3. Click "Install" in the popup

Once installed, you'll receive notifications when your dogs are up next!
```

**Edge**:
```
1. Click the three dots menu (...) in the top-right corner
2. Select "Apps" → "Install myK9Q"
   OR look for an install icon in the address bar
3. Click "Install" in the popup

Once installed, you'll receive notifications when your dogs are up next!
```

**iOS Safari**:
```
Tap the Share button, then tap "Add to Home Screen"
```

**Android Chrome**:
```
Tap the menu icon (⋮) and select "Add to Home Screen" or "Install App"
```

### 4. **PWA Detection Hook**
- **File**: [src/hooks/usePWAInstall.ts](../src/hooks/usePWAInstall.ts)
- **Purpose**: Detects if app is installed, if browser supports install prompts, and if user dismissed
- **Features**:
  - Listens for `beforeinstallprompt` event
  - Detects standalone mode (already installed)
  - Manages dismiss state (7-day localStorage expiry)
  - Provides platform-specific instructions

### 5. **Dismiss Functionality**
- **Behavior**: Clicking the X button dismisses the prompt
- **Cooldown**: 7 days before showing again
- **Storage**: `localStorage` key: `pwa_install_dismissed`
- **Data**: `{ timestamp: Date.now() }`

### 6. **Message Personalization**
The banner message adapts based on favorited dogs:
- **1 dog**: "Get notified when your dog is up next!"
- **2+ dogs**: "Get notified when your dogs are up next!"
- **Fallback**: "Install the app to receive notifications when your dogs are up next"

## Files Modified

### Created
- [src/components/ui/InstallPrompt.tsx](../src/components/ui/InstallPrompt.tsx) - Main component
- [src/components/ui/InstallPrompt.css](../src/components/ui/InstallPrompt.css) - Gradient styles
- [src/hooks/usePWAInstall.ts](../src/hooks/usePWAInstall.ts) - PWA detection hook

### Modified
- [src/pages/Home/Home.tsx](../src/pages/Home/Home.tsx) - Added banner rendering logic

## Development vs Production

### Development (localhost)
- ⚠️ **Chrome will NOT show automatic install prompt** on localhost in most cases
- The banner will display correctly
- Clicking "Install" shows manual instructions
- Manual installation:
  1. Chrome menu (⋮) → "Save and Share" → "Install app" (if available)
  2. Or look for install icon in address bar (⊕)

### Production (HTTPS domain)
- ✅ **Chrome WILL show automatic install prompt** when:
  - User visits the site
  - User engages with the site (clicks, scrolls)
  - `beforeinstallprompt` event fires
- Clicking "Install" button triggers native browser install dialog
- Much smoother user experience

## Testing

### Manual Test Steps
1. Log in as exhibitor (passcode: `e4b6c`)
2. Favorite 2+ dogs (click heart icon on dog cards)
3. Verify gradient banner appears at top
4. Click "Install" button
5. Verify browser-specific instructions appear
6. Click X to dismiss
7. Verify banner doesn't show again
8. Clear localStorage or wait 7 days
9. Verify banner shows again

### Browser Compatibility
| Browser | Auto Install | Manual Install | Tested |
|---------|--------------|----------------|--------|
| Chrome Desktop | ✅ (prod only) | ✅ | ✅ |
| Edge Desktop | ✅ (prod only) | ✅ | ✅ |
| Safari iOS | ❌ | ✅ | ⚠️ |
| Chrome Android | ✅ | ✅ | ⚠️ |
| Firefox | ❌ | ❌ | ❌ |

## Known Limitations

1. **Development Mode**: Chrome's `beforeinstallprompt` event rarely fires on localhost
2. **Firefox**: Does not support PWA installation (no `beforeinstallprompt` event)
3. **iOS Safari**: Requires manual "Add to Home Screen" - no automatic prompt
4. **Manifest Issues**: If manifest.json has errors, install won't work

## Design Decisions

### Why Only Show to Exhibitors?
- Judges, stewards, and admins don't need notifications about specific dogs
- Exhibitors care most about when their dogs are up next
- Reduces notification spam for other user roles

### Why Require 2+ Favorited Dogs?
- Users who favorite dogs are engaged and likely to benefit from notifications
- Prevents showing install prompt to casual browsers
- Creates a natural call-to-action workflow: favorite → install → get notified

### Why 7-Day Dismiss Cooldown?
- Not too aggressive (won't annoy users)
- Long enough for user to reconsider if they dismissed hastily
- Industry standard for install prompts

### Why Gradient Design?
- Matches login page aesthetic for brand consistency
- Eye-catching without being intrusive
- Modern, professional look
- Purple is associated with notifications/alerts

## Future Enhancements

1. **A/B Testing**: Test different messages to improve install conversion
2. **Analytics**: Track install prompt impressions, clicks, and actual installs
3. **Animations**: Add subtle pulse or shimmer effect to draw attention
4. **Smart Timing**: Show banner after user favorites 2nd dog (not immediately)
5. **Push Permission**: Request notification permission after install
6. **Custom Events**: Track when users favorite dogs, install app, enable notifications

## Related Systems

### Notification Integration
- **File**: [src/services/notificationIntegration.ts](../src/services/notificationIntegration.ts)
- **Connection**: After PWA install, notifications can be sent when favorited dogs are up next
- **Flow**: Favorite dogs → Install PWA → Enable notifications → Receive alerts

### Settings Store
- **File**: [src/stores/settingsStore.ts](../src/stores/settingsStore.ts)
- **Connection**: `enableNotifications` setting controls whether banner shows
- **Default**: `true` (users can disable in settings)

### Favorites System
- **Storage**: `localStorage` key: `dog_favorites_{licenseKey}`
- **Format**: Array of armband numbers `[100, 103]`
- **Persistence**: Survives page refresh

## Troubleshooting

### Banner Not Showing?
1. Check role is "exhibitor" (not judge/steward/admin)
2. Check 2+ dogs are favorited (look for red hearts)
3. Check settings: `enableNotifications` is true
4. Check localStorage: `pwa_install_dismissed` is not set or expired
5. Check console for `📱 InstallPrompt render check` log

### Install Not Working?
1. Check browser console for errors
2. Verify manifest.json loads correctly
3. Verify service worker is registered
4. Try hard refresh (Ctrl+Shift+R)
5. Try in production HTTPS environment
6. Check Chrome DevTools → Application → Manifest

### Gradient Not Showing?
1. Check InstallPrompt.css is loaded (DevTools → Sources)
2. Verify CSS class names match component
3. Try hard refresh to clear CSS cache
4. Check for CSS conflicts with other styles

---

**Status**: ✅ **COMPLETE** - PWA install banner fully implemented and ready for production deployment.

**Next Steps**: Deploy to production HTTPS domain to enable automatic browser install prompts.
