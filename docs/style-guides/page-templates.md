# MyK9Show Page Templates Guide

## Overview

This guide provides comprehensive templates and patterns for creating beautiful, consistent pages in the MyK9Show application. All templates follow our Apple-inspired design system and ensure perfect styling from the beginning.

### Document Structure
- **Quick Reference**: Template selection matrix
- **Template Implementations**: Complete code examples
- **State Management**: Loading, empty, and error patterns
- **Best Practices**: Guidelines for consistent implementation
- **Cross-References**: Links to design-system.md and design-tokens.json

### How to Use This Guide
1. **For New Pages**: Start with Quick Reference to choose template
2. **For Makeovers**: Identify current page type and apply corresponding template
3. **For Components**: Reference state management patterns and best practices
4. **For Consistency**: Follow implementation guidelines throughout

## Quick Reference

### Page Type Selection

| Page Type | Use When | Template | Key Features |
|-----------|----------|----------|--------------|
| **Dashboard** | Analytics, overview, metrics | `DashboardLayout` | Stats cards, activity feeds, charts |
| **List/Browse** | Browse shows, my entries, search results | `ListPageLayout` | Search, filters, view toggles, bulk actions |
| **Detail** | Show details, dog profiles, club info | `EntityDetailLayout` | Breadcrumbs, sidebar, header actions |
| **Standard** | Forms, settings, static content | `StandardPageLayout` | Simple header, clean content area |

## Template Implementations

### 1. Dashboard Page Template

**Best for:** Calendar, Secretary Dashboard, Admin Overview

```tsx
import { DashboardLayout, StatsCard, Timeline } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Calendar, Trophy, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Shows",
      value: "24",
      subtitle: "This year",
      icon: Calendar,
      trend: "up",
      trendValue: "+12%"
    },
    {
      title: "Upcoming Events", 
      value: "8",
      subtitle: "Next 30 days",
      icon: Users
    },
    {
      title: "My Entries",
      value: "156", 
      subtitle: "All time",
      icon: Trophy,
      trend: "up",
      trendValue: "+23%"
    },
    {
      title: "Success Rate",
      value: "89%",
      subtitle: "Last 6 months", 
      icon: TrendingUp
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "success",
      icon: Trophy,
      title: "Entry submitted",
      description: "Successfully entered Spring Classic Dog Show",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      type: "info", 
      icon: Calendar,
      title: "Show reminder",
      description: "AKC Specialty Show starts tomorrow",
      timestamp: "1 day ago"
    }
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      }
      stats={stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    >
      <div className="grid gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={recentActivity} />
          </CardContent>
        </Card>
        
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Event content */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### 2. List/Browse Page Template

**Best for:** Browse Shows, My Entries, Search Results

```tsx
import { useState } from 'react';
import { 
  ListPageLayout, 
  AdvancedSearchBar, 
  FilterPanel, 
  ViewToggle,
  BulkActionBar,
  SearchEmptyState,
  FirstTimeEmptyState,
  CardSkeleton
} from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, Calendar, Plus, Download, Edit, Trash2 } from 'lucide-react';

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: Grid3X3 },
  { value: 'list', label: 'List', icon: List },
  { value: 'calendar', label: 'Calendar', icon: Calendar }
];

export default function BrowseShowsPage() {
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const shows = []; // Your data here

  const filterOptions = [
    {
      key: 'type',
      label: 'Show Type',
      type: 'select',
      placeholder: 'Select type',
      options: [
        { value: 'conformation', label: 'Conformation' },
        { value: 'agility', label: 'Agility' },
        { value: 'obedience', label: 'Obedience' }
      ]
    },
    {
      key: 'date',
      label: 'Date Range',
      type: 'range'
    },
    {
      key: 'location',
      label: 'Location',
      type: 'checkbox',
      options: [
        { value: 'california', label: 'California' },
        { value: 'texas', label: 'Texas' },
        { value: 'florida', label: 'Florida' }
      ]
    }
  ];

  const bulkActions = [
    {
      key: 'export',
      label: 'Export',
      icon: Download,
      onClick: () => console.log('Export selected'),
      variant: 'outline'
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: () => console.log('Edit selected'),
      disabled: selectedItems.length !== 1
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: () => console.log('Delete selected'),
      variant: 'destructive'
    }
  ];

  const handleFilterChange = (key, value) => {
    // Filter logic here
  };

  return (
    <ListPageLayout
      title="Browse Shows"
      searchBar={
        <AdvancedSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search shows by name, location, or type..."
          filters={filters}
          onFilterChange={handleFilterChange}
          suggestions={['AKC Show', 'Specialty Show', 'Agility Trial']}
        />
      }
      filters={
        <FilterPanel 
          filters={filterOptions} 
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters([])}
        />
      }
      viewControls={
        <ViewToggle 
          view={view} 
          onViewChange={setView} 
          options={VIEW_OPTIONS}
        />
      }
      bulkActions={selectedItems.length > 0 && (
        <BulkActionBar
          selectedCount={selectedItems.length}
          actions={bulkActions}
          onClearSelection={() => setSelectedItems([])}
        />
      )}
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : shows.length === 0 ? (
        searchTerm ? (
          <SearchEmptyState 
            searchTerm={searchTerm} 
            onClearSearch={() => setSearchTerm('')} 
          />
        ) : (
          <FirstTimeEmptyState
            title="No shows yet"
            description="Start by creating your first show or browsing available events in your area."
            primaryAction={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Show
              </Button>
            }
            secondaryAction={
              <Button variant="outline">
                Learn More
              </Button>
            }
          />
        )
      ) : (
        <div className={view === 'grid' ? 
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
          'space-y-4'
        }>
          {shows.map(show => (
            <ShowCard 
              key={show.id} 
              show={show} 
              view={view}
              selected={selectedItems.includes(show.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedItems([...selectedItems, show.id]);
                } else {
                  setSelectedItems(selectedItems.filter(id => id !== show.id));
                }
              }}
            />
          ))}
        </div>
      )}
    </ListPageLayout>
  );
}
```

### 3. Detail Page Template

**Best for:** Show Details, Dog Profiles, Club Information

```tsx
import {
  EntityDetailLayout,
  Timeline,
  InlineError
} from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Share, Download, Calendar, MapPin, Users } from 'lucide-react';

export default function ShowDetailPage({ showId }) {
  const show = {}; // Fetch show data
  const error = null; // Error state

  const breadcrumbs = (
    <div className="flex items-center text-sm text-muted-foreground">
      <a href="/shows" className="hover:text-foreground">Shows</a>
      <span className="mx-2">/</span>
      <span className="text-foreground">{show.name}</span>
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button variant="outline">
        <Share className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button>
        <Edit className="mr-2 h-4 w-4" />
        Edit Show
      </Button>
    </div>
  );

  const sidebar = (
    <div className="space-y-6">
      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{show.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{show.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{show.entries} entries</span>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={show.status === 'open' ? 'default' : 'secondary'}>
            {show.status}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );

  if (error) {
    return (
      <EntityDetailLayout
        title="Error Loading Show"
        breadcrumbs={breadcrumbs}
      >
        <InlineError 
          message="Failed to load show details. Please try again."
          onRetry={() => window.location.reload()}
        />
      </EntityDetailLayout>
    );
  }

  return (
    <EntityDetailLayout
      title={show.name}
      subtitle={`${show.type} • ${show.organization}`}
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
      sidebar={sidebar}
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Show Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{show.description}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classes">
          {/* Classes content */}
        </TabsContent>
        
        <TabsContent value="entries">
          {/* Entries content */}
        </TabsContent>
        
        <TabsContent value="results">
          {/* Results content */}
        </TabsContent>
      </Tabs>
    </EntityDetailLayout>
  );
}
```

### 4. Standard Page Template

**Best for:** Forms, Settings, Static Content

```tsx
import { StandardPageLayout } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <StandardPageLayout 
      title="Settings" 
      subtitle="Manage your account preferences and application settings"
    >
      <div className="space-y-8 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Enter first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Enter last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Notification settings */}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </StandardPageLayout>
  );
}
```

## State Management Patterns

### Loading States

```tsx
// Page-level loading
if (loading) {
  return <PageLoadingSkeleton />;
}

// Section-level loading  
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  // Actual content
)}
```

### Empty States

```tsx
// First-time empty state
<FirstTimeEmptyState
  title="No entries yet"
  description="Start by entering your first dog show competition."
  primaryAction={<Button>Create Entry</Button>}
  secondaryAction={<Button variant="outline">Browse Shows</Button>}
/>

// Search empty state
<SearchEmptyState 
  searchTerm={searchTerm}
  onClearSearch={() => setSearchTerm('')}
/>

// Standard empty state
<EmptyState
  icon={Calendar}
  title="No upcoming shows"
  description="Check back later for new show announcements."
  action={<Button variant="outline">Browse All Shows</Button>}
/>
```

### Error States

```tsx
// Page-level error
<PageError
  title="Something went wrong"
  description="We're having trouble loading this page. Please try again."
  onRetry={() => window.location.reload()}
  supportLink="/support"
/>

// Inline error
<InlineError
  message="Failed to load entries. Please try again."
  onRetry={refetch}
/>
```

## Best Practices

### 1. Layout Selection
- **Dashboard**: Use for analytics, metrics, and overview pages
- **List**: Use for browsable content with search/filter needs  
- **Detail**: Use for individual item pages with rich information
- **Standard**: Use for forms, settings, and simple content

### 2. Content Organization
- Keep related actions together in header action groups
- Use tabs for related but distinct content sections
- Place contextual information in sidebars
- Group form fields logically with proper spacing

### 3. State Handling
- Always provide loading states for better UX
- Include meaningful empty states that guide user actions
- Handle errors gracefully with recovery options
- Use skeleton loaders that match your content structure

### 4. Responsive Considerations

#### Breakpoint Testing Checklist
```tsx
// Mobile (320px - 767px)
- [ ] Single column layouts
- [ ] Touch-friendly button sizes (min 44px)
- [ ] Readable font sizes (min 16px for inputs)
- [ ] Adequate spacing between interactive elements
- [ ] Horizontal scrolling avoided
- [ ] Navigation adapts to small screens

// Tablet (768px - 1023px)
- [ ] Two-column layouts where appropriate
- [ ] Optimized for both portrait and landscape
- [ ] Hover states work with touch
- [ ] Form layouts adapt gracefully

// Desktop (1024px+)
- [ ] Multi-column layouts
- [ ] Hover effects functional
- [ ] Keyboard navigation works
- [ ] Mouse interactions optimized
- [ ] Wide-screen considerations
```

#### Mobile-Specific Patterns
```tsx
// Mobile navigation
const MobileNav = () => (
  <div className="md:hidden">
    <Button
      variant="ghost"
      size="sm"
      className="h-12 w-12" // 48px touch target
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
    >
      <Menu className="h-6 w-6" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  </div>
);

// Mobile form layout
const MobileForm = () => (
  <form className="space-y-6">
    {/* Stack all form elements vertically on mobile */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <FormField />
      <FormField />
    </div>
    
    {/* Full-width buttons on mobile */}
    <div className="flex flex-col gap-3 md:flex-row md:justify-end">
      <Button variant="outline" className="w-full md:w-auto">
        Cancel
      </Button>
      <Button className="w-full md:w-auto">
        Save
      </Button>
    </div>
  </form>
);

// Mobile-optimized cards
const ResponsiveCard = ({ children }) => (
  <Card className="p-4 md:p-6 rounded-lg md:rounded-xl">
    {children}
  </Card>
);
```

#### Performance on Mobile
```tsx
// Lazy load images
const OptimizedImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn("bg-muted animate-pulse", className)}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Reduce motion for users who prefer it
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// Usage in components
const AnimatedCard = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Card className={cn(
      "transition-all duration-300",
      !prefersReducedMotion && "hover:shadow-md hover:-translate-y-0.5"
    )}>
      {children}
    </Card>
  );
};
```

### 5. Accessibility

#### Semantic HTML
```tsx
// Good: Semantic structure
<main>
  <header>
    <h1>Page Title</h1>
    <nav aria-label="Page actions">
      <Button>Primary Action</Button>
    </nav>
  </header>
  <section aria-labelledby="content-heading">
    <h2 id="content-heading">Content Section</h2>
    {/* Content */}
  </section>
</main>

// Good: Form accessibility
<form onSubmit={handleSubmit}>
  <fieldset>
    <legend>Contact Information</legend>
    <Label htmlFor="email">Email Address</Label>
    <Input
      id="email"
      type="email"
      required
      aria-describedby="email-help email-error"
    />
    <div id="email-help" className="text-sm text-muted-foreground">
      We'll never share your email address
    </div>
    {error && (
      <div id="email-error" className="text-sm text-destructive" role="alert">
        {error}
      </div>
    )}
  </fieldset>
</form>
```

#### Focus Management
```tsx
// Focus trap for modals
import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Implement focus trap logic here
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
};
```

#### Screen Reader Support
```tsx
// Status announcements
const [announcement, setAnnouncement] = useState('');

const announceToScreenReader = (message) => {
  setAnnouncement(message);
  setTimeout(() => setAnnouncement(''), 1000);
};

// Usage
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Trigger announcement
const handleSave = async () => {
  await saveData();
  announceToScreenReader('Data saved successfully');
};
```

#### Color Contrast
```tsx
// High contrast alternatives
const getContrastClasses = (useHighContrast) => {
  if (useHighContrast) {
    return {
      text: "text-black dark:text-white",
      background: "bg-white dark:bg-black",
      border: "border-black dark:border-white border-2"
    };
  }
  return {
    text: "text-foreground",
    background: "bg-background",
    border: "border-border"
  };
};
```

## Integration with Design System

### Required Imports for All Templates
```tsx
// Core layout components
import { 
  DashboardLayout, 
  ListPageLayout, 
  EntityDetailLayout, 
  StandardPageLayout 
} from '@/components/layouts';

// UI components (ShadCN)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons (Lucide React)
import { 
  Plus, Edit, Trash2, Download, Share, Calendar, 
  MapPin, Users, Eye, Search, Filter, Grid3X3, 
  List, TrendingUp, TrendingDown, AlertCircle, 
  RefreshCw, Check 
} from 'lucide-react';

// Utilities
import { cn } from '@/lib/utils';
```

### CSS Custom Properties Integration
All templates automatically inherit theme variables from [design-tokens.json](./design-tokens.json):
```css
/* Available in all components */
var(--background)
var(--foreground)
var(--card)
var(--card-foreground)
var(--muted)
var(--muted-foreground)
var(--border)
var(--primary)
var(--primary-foreground)
var(--destructive)
```

### Animation Tokens
Consistent animations using Apple-inspired easing:
```tsx
// Hover effects
"hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"

// Apple easing function
"transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"

// Loading states
"animate-pulse"
```

## Mobile-First Responsive Patterns

### Breakpoint Strategy
```tsx
// Mobile First (320px+)
"grid grid-cols-1 gap-4"

// Tablet (768px+)
"md:grid-cols-2 md:gap-6"

// Desktop (1024px+)
"lg:grid-cols-3 lg:gap-8"

// Large Desktop (1280px+)
"xl:grid-cols-4"
```

### Touch-Friendly Components
```tsx
// Minimum 44px touch targets
"min-h-[44px] min-w-[44px]"

// Mobile button sizing
"h-12 px-6 text-base" // Mobile
"md:h-10 md:px-4 md:text-sm" // Desktop

// Mobile spacing
"p-4 gap-4" // Mobile
"md:p-6 md:gap-6" // Desktop
```

## Advanced Error Boundaries

### Page-Level Error Boundary
```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <pre className="text-xs bg-muted p-2 rounded text-left overflow-auto">
            {error.message}
          </pre>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// Wrap your page components
export default function MyPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <YourPageContent />
    </ErrorBoundary>
  );
}
```

### Form Validation Patterns
```tsx
// Field-level validation
const [errors, setErrors] = useState({});

const validateField = (name, value) => {
  const newErrors = { ...errors };
  
  switch (name) {
    case 'email':
      if (!value || !/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
      break;
    case 'name':
      if (!value || value.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
      break;
  }
  
  setErrors(newErrors);
};

// Form field with validation
<div className="space-y-2">
  <Label htmlFor="email" className="flex items-center gap-1">
    Email
    <span className="text-destructive">*</span>
  </Label>
  <Input
    id="email"
    type="email"
    value={formData.email}
    onChange={(e) => {
      setFormData({ ...formData, email: e.target.value });
      validateField('email', e.target.value);
    }}
    className={cn(
      "transition-colors",
      errors.email && "border-destructive focus:ring-destructive/20"
    )}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {errors.email}
    </p>
  )}
</div>
```

## Performance Optimization Patterns

### Lazy Loading with Suspense
```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Loading fallback
const ComponentSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 bg-muted rounded animate-pulse" />
    <div className="h-32 bg-muted rounded animate-pulse" />
  </div>
);

// Usage in template
<Suspense fallback={<ComponentSkeleton />}>
  <HeavyComponent />
</Suspense>
```

### Virtual Scrolling for Large Lists
```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style} className="p-2 border-b border-border">
      <ShowCard show={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## Testing Utilities

### Component Test Helpers
```tsx
// Test utilities for templates
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock layout components for testing
vi.mock('@/components/layouts', () => ({
  DashboardLayout: ({ children, title }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
  ListPageLayout: ({ children, title }) => (
    <div data-testid="list-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

// Test template implementation
const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export { renderWithProviders };
```

This comprehensive template system ensures that every new page in MyK9Show follows consistent patterns and delivers a polished, Apple-inspired user experience from day one.