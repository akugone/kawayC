# Home Navigation System

This document describes the home navigation system implemented in the iExec Confidential KYC application.

## Overview

The home navigation system provides multiple ways for users to return to the landing page from any part of the application. This ensures users never get lost and can easily navigate back to the main page.

## Components

### HomeNav Component

A reusable component that provides home navigation functionality with multiple variants.

```tsx
import { HomeNav } from "@/components/ui/home-nav";

// Header variant (with logo)
<HomeNav variant="header" />

// Inline variant (compact)
<HomeNav variant="inline" showLogo={false} />

// Floating variant (for fixed positioning)
<HomeNav variant="floating" />
```

## Variants

### 1. Header Variant (Default)

- Includes the iExec logo and "iExec KYC" text
- Used in main navigation areas
- Styled as a ghost button with medium font weight

### 2. Inline Variant

- Compact button with just "Home" text and icon
- Used alongside other navigation buttons
- Can be configured to show/hide logo

### 3. Floating Variant

- Designed for fixed positioning
- Used in the global floating button group
- Styled as an outline button with shadow

## Implementation

### Global Floating Navigation

The layout includes a floating button group in the bottom-left corner:

```tsx
// In src/app/layout.tsx
<div className="fixed bottom-4 left-4 z-50 flex flex-col space-y-2">
  <HomeNav variant="floating" />
  <DebugToggle variant="floating" />
</div>
```

### Page-Specific Navigation

Each KYC page includes home navigation in the header:

#### KYC Dashboard (`/kyc`)

- Home button in the top-left corner
- Centered title with spacer for balance

#### Document Upload (`/kyc/upload`)

- Back button + Home button in the header
- Both buttons grouped together

#### Processing (`/kyc/processing`)

- Back button + Home button in the header
- Back button disabled during processing

#### Results (`/kyc/result`)

- Back button + Home button in the header
- Consistent with other pages

### Error State Navigation

All error states include home navigation:

```tsx
if (!isConnected) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Wallet not connected</h1>
        <div className="space-y-2">
          <Button onClick={() => router.push("/")} className="mr-2">
            Connect Wallet
          </Button>
          <HomeNav variant="inline" />
        </div>
      </div>
    </div>
  );
}
```

## Navigation Flow

```
Landing Page (/)
    ↓
KYC Dashboard (/kyc)
    ↓
Document Upload (/kyc/upload)
    ↓
Processing (/kyc/processing)
    ↓
Results (/kyc/result)
```

From any page, users can:

1. **Go Back**: Navigate to the previous step in the KYC flow
2. **Go Home**: Return directly to the landing page
3. **Use Floating Buttons**: Access home and debug toggles from anywhere

## User Experience Benefits

1. **Never Lost**: Users can always find their way back to the main page
2. **Multiple Access Points**: Home navigation available in multiple locations
3. **Consistent Design**: Same styling and behavior across all pages
4. **Contextual Placement**: Buttons positioned logically within the UI
5. **Accessibility**: Clear labels and hover states for all buttons

## Usage Examples

### Adding Home Navigation to a New Page

```tsx
import { HomeNav } from "@/components/ui/home-nav";

export default function NewPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Home Navigation */}
      <div className="flex items-center justify-between mb-8">
        <HomeNav variant="inline" />
        <div>
          <h1 className="text-3xl font-bold">Page Title</h1>
          <p className="text-gray-600">Page description</p>
        </div>
      </div>

      {/* Page content */}
    </div>
  );
}
```

### Custom Home Navigation

```tsx
// Custom styling
<HomeNav
  variant="inline"
  className="bg-blue-500 text-white hover:bg-blue-600"
  showLogo={false}
/>

// With custom click handler
<Button onClick={() => {
  // Custom logic before going home
  router.push("/");
}}>
  <Home className="w-4 h-4 mr-2" />
  Custom Home Text
</Button>
```

## Best Practices

1. **Always Include Home Navigation**: Every page should have a way to get back to the landing page
2. **Consistent Placement**: Use the same positioning across similar page types
3. **Clear Labeling**: Use descriptive text or icons that users understand
4. **Accessibility**: Ensure buttons have proper titles and keyboard navigation
5. **Mobile Friendly**: Buttons should be appropriately sized for touch interfaces

## Technical Details

- **Routing**: Uses Next.js `useRouter` for client-side navigation
- **Styling**: Consistent with the app's design system using Tailwind CSS
- **Icons**: Uses Lucide React icons for consistency
- **Responsive**: Works well on all screen sizes
- **Performance**: Lightweight component with minimal re-renders
