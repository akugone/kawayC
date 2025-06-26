# Debug System Documentation

This document describes the debug system implemented in the iExec Confidential KYC application.

## Overview

The debug system provides a centralized way to show/hide debug information throughout the application. It replaces the previous approach of checking `process.env.NODE_ENV === "development"` with a user-controllable toggle.

## Features

- **Global Debug Toggle**: Toggle debug mode on/off from anywhere in the app
- **Persistent State**: Debug preference is saved in localStorage
- **Keyboard Shortcut**: Press `Ctrl+Shift+D` to toggle debug mode
- **Multiple Toggle Variants**: Different styles for different contexts
- **Reusable Components**: Easy-to-use debug components

## Components

### DebugToggle

A button component that toggles debug mode.

```tsx
import { DebugToggle } from "@/components/ui/debug-toggle";

// Default variant
<DebugToggle />

// Compact variant (icon only)
<DebugToggle variant="compact" />

// Floating variant (fixed position)
<DebugToggle variant="floating" />
```

### DebugSection

A component that displays debug data in a formatted way.

```tsx
import { DebugSection } from "@/components/ui/debug-section";

<DebugSection data={someData} title="Custom Title" showTitle={true} />;
```

## Hooks

### useDebug

Main hook for accessing debug state and functions.

```tsx
import { useDebug } from "@/context/DebugContext";

const { isDebugEnabled, toggleDebug, setDebugEnabled } = useDebug();
```

### useDebugMode

Simple hook that returns just the debug state.

```tsx
import { useDebugMode } from "@/hooks/useDebugMode";

const isDebugEnabled = useDebugMode();
```

### useDebugRender

Hook that provides a function to conditionally render debug content.

```tsx
import { useDebugRender } from "@/hooks/useDebugMode";

const { showDebug } = useDebugRender();

return (
  <div>
    {showDebug(() => (
      <div>Debug content here</div>
    ))}
  </div>
);
```

## Usage Examples

### Basic Debug Section

```tsx
import { DebugSection } from "@/components/ui/debug-section";

function MyComponent() {
  const [data, setData] = useState({});

  return (
    <div>
      {/* Your component content */}

      <DebugSection data={data} />
    </div>
  );
}
```

### Conditional Debug Rendering

```tsx
import { useDebugMode } from "@/hooks/useDebugMode";

function MyComponent() {
  const isDebugEnabled = useDebugMode();

  return (
    <div>
      {/* Your component content */}

      {isDebugEnabled && (
        <div className="debug-info">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### Custom Debug Content

```tsx
import { useDebugRender } from "@/hooks/useDebugMode";

function MyComponent() {
  const { showDebug } = useDebugRender();

  return (
    <div>
      {/* Your component content */}

      {showDebug(() => (
        <div className="custom-debug">
          <h3>Custom Debug Info</h3>
          <p>This will only show when debug is enabled</p>
        </div>
      ))}
    </div>
  );
}
```

## Keyboard Shortcuts

- **Ctrl+Shift+D**: Toggle debug mode on/off

## Configuration

The debug system is automatically initialized with the following behavior:

1. **Development Mode**: Debug is enabled by default when `NODE_ENV === "development"`
2. **Production Mode**: Debug is disabled by default
3. **User Preference**: Once the user toggles debug mode, their preference is saved and restored on subsequent visits

## Migration from Old System

The old system used:

```tsx
{
  process.env.NODE_ENV === "development" && <div>Debug content</div>;
}
```

The new system uses:

```tsx
<DebugSection data={data} />
```

Or for custom content:

```tsx
{
  showDebug(() => <div>Debug content</div>);
}
```

## Best Practices

1. **Use DebugSection for structured data**: When you have JSON data to display
2. **Use useDebugRender for custom layouts**: When you need custom styling or layout
3. **Keep debug content minimal**: Only show essential debugging information
4. **Test both states**: Ensure your app works well with debug enabled and disabled
5. **Use descriptive titles**: Make debug sections easy to identify

## Troubleshooting

### Debug toggle not working

- Ensure the DebugProvider is wrapping your app in the context hierarchy
- Check that the toggle component is not being overridden by other styles

### Debug state not persisting

- Check that localStorage is available in your environment
- Verify that the debug context is properly initialized

### Keyboard shortcut not working

- Ensure no other components are preventing the keydown event
- Check that the event listener is properly attached
