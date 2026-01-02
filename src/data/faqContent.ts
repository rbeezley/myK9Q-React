/**
 * FAQ Content - Bundled for offline access
 *
 * This content is derived from USER_GUIDE.md and provides
 * help content that works without network connectivity.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: 'rocket' | 'search' | 'check-circle' | 'clipboard' | 'bar-chart' | 'bell' | 'users' | 'shield' | 'wifi-off' | 'settings' | 'help-circle';
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket',
    items: [
      {
        question: 'How do I log in?',
        answer: 'Enter your 5-character passcode provided by the show organizers. The first letter indicates your role: a=Admin, j=Judge, s=Steward, e=Exhibitor.',
      },
      {
        question: 'How do I install the app?',
        answer: 'myK9Q is a Progressive Web App (PWA) that can be installed on your device. You can also install anytime from **Settings → Install App**.\n\n**iPhone/iPad (Safari):**\n1. Tap the Share button at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right\n\n**Android (Chrome):**\n1. Tap Chrome\'s three-dot menu (⋮) at the top right of the browser\n2. Select "Install app" or "Add to Home Screen"\n3. Tap "Install"\n\n**Desktop Chrome:**\n1. Look for the install icon (⊕) in the address bar and click it\n2. Or click Chrome\'s menu (⋮) → "Cast, save, and share" → "Install page as app" or "Create shortcut..."\n3. If you see "Open in myK9Q" instead, it\'s already installed - click that to open it!\n\n**Desktop Edge:**\n1. Look for the install icon (⊕) in the address bar\n2. Or click Edge\'s menu (...) → "Apps" → "Install myK9Q"',
      },
      {
        question: 'Why should I install the app?',
        answer: 'Installing myK9Q gives you: (1) Push notifications when your favorited dogs are up next, (2) Faster loading and offline access, (3) Home screen icon for quick access, (4) Full-screen experience without browser UI. On iPhone, push notifications ONLY work when the app is installed to your home screen.',
      },
      {
        question: 'What can I do with my role?',
        answer: 'Exhibitors can check in dogs and view results. Stewards add run order management. Judges add scoring and class management. Admins have full access including result visibility settings.',
      },
    ],
  },
  {
    id: 'finding-dogs',
    title: 'Finding Dogs & Classes',
    icon: 'search',
    items: [
      {
        question: 'How do I find my dog?',
        answer: 'Tap the filter icon (funnel) on the Home screen to open search, then type your dog\'s name, breed, or handler name.',
      },
      {
        question: 'How do I see my dog\'s classes?',
        answer: 'Tap on your dog\'s armband number from the Home screen. The Dog Details page shows all classes that dog is entered in.',
      },
      {
        question: 'How do I favorite a dog?',
        answer: 'Tap the heart icon on any dog card. Favorited dogs appear at the top when you select the "Favorites" tab.',
      },
      {
        question: 'How do I find a specific class?',
        answer: 'Tap the hamburger menu (☰) → Classes, or from Home tap a trial card to see its classes. Use the filter icon to search by name or element.',
      },
    ],
  },
  {
    id: 'check-in',
    title: 'Check-In',
    icon: 'check-circle',
    items: [
      {
        question: 'How do I check in my dog?',
        answer: 'Go to the Entry List for your class, find your dog, tap the status button, and select "Checked In". You can also check in from the Dog Details page.',
      },
      {
        question: 'What do the entry status colors mean?',
        answer: 'Gray = Not checked in • Teal = Checked in • Orange = Come to Gate • Purple = At Gate • Blue = In Ring • Amber = Conflict • Red = Pulled • Green = Completed',
      },
      {
        question: 'What do the class status colors mean?',
        answer: 'Gray = No status • Brown = Setup • Orange = Briefing • Purple = Break • Teal = Start Time set • Blue = In Progress • Green = Completed',
      },
      {
        question: 'What does "Conflict" status mean?',
        answer: 'A conflict means your dog is entered in multiple classes that may be running at the same time. Check with the steward about which class to go to first.',
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring (Judges)',
    icon: 'clipboard',
    items: [
      {
        question: 'How do I score a dog?',
        answer: 'Navigate to the Entry List, tap the scoresheet icon (clipboard) next to the dog, enter score/time, tap Submit Score, then confirm.',
      },
      {
        question: 'Can I score offline?',
        answer: 'Yes! Scores save locally and sync automatically when you reconnect. Don\'t log out until scores are synced.',
      },
      {
        question: 'How do I change the run order?',
        answer: 'Open the actions menu (⋮) → Set Run Order. Choose: Armband Low to High, Armband High to Low, Random Shuffle, or Manual Drag and Drop.',
      },
      {
        question: 'How do I mark a dog "In Ring"?',
        answer: 'Tap the dog\'s status button and select "In Ring". This moves them to the top of the list and helps exhibitors know who\'s competing.',
      },
      {
        question: 'How do I print reports?',
        answer: 'On the Entry List, tap the three-dot menu (⋮) and choose: Check-in Sheet, Results Sheet, or Scoresheet Report.',
      },
    ],
  },
  {
    id: 'results',
    title: 'Results & Statistics',
    icon: 'bar-chart',
    items: [
      {
        question: 'How do I see my dog\'s scores?',
        answer: 'Tap on your dog from the Home screen. The Dog Details page shows all entries with scores, times, and qualification status.',
      },
      {
        question: 'How do I see overall show results?',
        answer: 'Tap the hamburger menu (☰) → The Podium. View 1st, 2nd, and 3rd place dogs, with filters for trial, element, or level.',
      },
      {
        question: 'How do I see statistics?',
        answer: 'Tap the hamburger menu (☰) → Statistics. View qualification rates, fastest times, and breed performance with various filters.',
      },
      {
        question: 'Where can I see fastest times?',
        answer: 'Go to Statistics and scroll down to the "Fastest Times" table showing top performers ranked by completion time.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'bell',
    items: [
      {
        question: 'What notifications can I receive?',
        answer: '**Up Soon** - Sent when the dog running before yours finishes, giving you time to get to the gate.\n\n**Come to Gate** - Sent when the steward calls your dog to the gate.\n\n**Podium Placement** - Sent when your favorited dog places 1st, 2nd, or 3rd in their class.\n\nAll notifications only apply to dogs you\'ve favorited (tap the heart icon on any dog card).',
      },
      {
        question: 'How do I set up notifications?',
        answer: '**Step 1: Install the app** (required for iPhone)\nGo to Settings → Install App, or on iPhone: Tap Share → "Add to Home Screen"\n\n**Step 2: Favorite your dogs**\nTap the heart icon on any dog card to favorite it\n\n**Step 3: Enable notifications**\nGo to Settings → Notifications → Enable push notifications\nAllow permission when your browser asks\n\n**Step 4: Test it**\nTap "Send Test Notification" in Settings to confirm it\'s working',
      },
      {
        question: 'Why am I not receiving notifications?',
        answer: '**On iPhone:**\n• You MUST open the app from your home screen (not Safari)\n• Make sure the app is installed (Share → Add to Home Screen)\n• Check iPhone Settings → myK9Q → Notifications are allowed\n\n**On Android/Desktop:**\n• Check that browser notifications are allowed in your device settings\n• Some browsers block notifications - try Chrome\n\n**General checks:**\n• Make sure you\'ve favorited the dogs you want notifications for\n• Verify notifications are enabled in Settings → Notifications\n• Try the "Send Test Notification" button',
      },
      {
        question: 'I accidentally blocked notifications. How do I fix it?',
        answer: '**iPhone:**\nGo to iPhone Settings → scroll down to myK9Q → Notifications → Allow Notifications\n\n**Android Chrome:**\nTap the lock icon in the address bar → Site settings → Notifications → Allow\n\n**Desktop Chrome:**\nClick the lock icon in the address bar → Site settings → Notifications → Allow\n\nAfter allowing, return to myK9Q Settings and enable notifications again.',
      },
      {
        question: 'Do notifications work when the app is closed?',
        answer: 'Yes! Push notifications are delivered by your device even when the app is closed or your phone is locked. When you tap a notification, it opens directly to the relevant dog or class.\n\n**Note:** If you force-quit the app on iPhone, notifications may be delayed until you reopen it.',
      },
      {
        question: 'How do I turn off notifications?',
        answer: 'Go to Settings → Notifications and toggle off "Enable push notifications". You can also unfavorite specific dogs if you only want to stop notifications for certain dogs while keeping others.',
      },
      {
        question: 'Will notifications drain my battery?',
        answer: 'No. Push notifications use minimal battery because your device receives them passively - the app doesn\'t need to constantly check for updates. The notification system is designed to be efficient.',
      },
    ],
  },
  {
    id: 'steward',
    title: 'Steward Tasks',
    icon: 'users',
    items: [
      {
        question: 'How do I manage the gate?',
        answer: 'On the Entry List: when a dog arrives, change status to "At Gate". When it\'s their turn, change to "In Ring". The judge marks completion.',
      },
      {
        question: 'How do I call a dog to the gate?',
        answer: 'Change their status to "Come to Gate". If the exhibitor has notifications enabled, they\'ll receive an alert.',
      },
      {
        question: 'How do I handle a scratched dog?',
        answer: 'Tap the dog\'s status and select "Pulled". This removes them from the active run order.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin Tasks',
    icon: 'shield',
    items: [
      {
        question: 'Where are admin settings?',
        answer: 'Tap the hamburger menu (☰) → Results Control (only visible to admin users).',
      },
      {
        question: 'What can I configure in Results Control?',
        answer: 'Result visibility (when scores show), self check-in (on/off per class), and live results toggle.',
      },
      {
        question: 'Where is the audit log?',
        answer: 'In Results Control, tap the menu icon (⋮) → Audit Log to see all scoring actions, who made them, and when.',
      },
    ],
  },
  {
    id: 'offline',
    title: 'Offline Mode',
    icon: 'wifi-off',
    items: [
      {
        question: 'Does the app work offline?',
        answer: 'Yes! After logging in, all your show data is stored on your device. You can view data, check in dogs, and score entries. Changes sync when you reconnect.',
      },
      {
        question: 'How do I know if I\'m offline?',
        answer: 'Look for the sync status icon in the header. A crossed-out Wi-Fi symbol indicates offline mode.',
      },
      {
        question: 'Why can\'t I log out?',
        answer: 'If you have pending scores that haven\'t synced, you need to wait for them to upload before logging out. This prevents losing scores.',
      },
      {
        question: 'How do I force a sync?',
        answer: 'Pull down on any list to refresh, tap the refresh icon, or tap the sync status icon in the header → Sync Now.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    items: [
      {
        question: 'How do I change to dark mode?',
        answer: 'Go to Settings → Appearance → Theme and choose Dark (or Auto to follow your device\'s system setting).',
      },
      {
        question: 'How do I export my data?',
        answer: 'Go to Settings → Advanced → Export My Data (Admin only).',
      },
      {
        question: 'How do I clear cached data?',
        answer: 'Go to Settings → Advanced → Clear All Data (Admin only). Note: This requires re-downloading show data on next login.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'help-circle',
    items: [
      {
        question: 'The app seems stuck or frozen',
        answer: 'Pull down to refresh. If that doesn\'t work, close and reopen the app. Check your internet connection.',
      },
      {
        question: 'My scores aren\'t showing up',
        answer: 'Check if you\'re online (sync icon in header). Pending scores upload automatically. Pull down to refresh after reconnecting.',
      },
      {
        question: 'I can\'t find my dog',
        answer: 'Make sure you\'re logged in with the correct passcode. Use the filter icon to search. Check "All Dogs" tab, not just Favorites.',
      },
      {
        question: 'Push notifications aren\'t working',
        answer: 'See the detailed troubleshooting in the Notifications section. Quick checks: (1) iPhone users must install the app to home screen first, (2) Make sure you\'ve favorited dogs, (3) Check Settings → Notifications is enabled, (4) Try the "Send Test Notification" button.',
      },
    ],
  },
];

/**
 * Search FAQs by keyword
 */
export function searchFAQs(query: string): FAQItem[] {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (searchTerms.length === 0) return [];

  const results: FAQItem[] = [];

  for (const category of faqCategories) {
    for (const item of category.items) {
      const text = `${item.question} ${item.answer}`.toLowerCase();
      const matches = searchTerms.some(term => text.includes(term));
      if (matches) {
        results.push(item);
      }
    }
  }

  return results;
}

/**
 * Get total FAQ count
 */
export function getFAQCount(): number {
  return faqCategories.reduce((sum, cat) => sum + cat.items.length, 0);
}
