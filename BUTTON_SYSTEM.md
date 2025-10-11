# 🎨 Button & Menu System - Antystyki

## Button Component

A reusable, beautiful button system with multiple variants, sizes, and states.

### Variants

#### 1. **Primary** (Default)
- Gradient: Gray-700 → Gray-800
- Border: Gray-600
- Best for: Main actions (CTAs)
```tsx
<Button variant="primary">Submit</Button>
```

#### 2. **Secondary**
- Gradient: Gray-800 → Gray-900
- Border: Gray-700
- Best for: Secondary actions
```tsx
<Button variant="secondary">Cancel</Button>
```

#### 3. **Outline**
- Transparent background
- Border: Gray-700
- Best for: Tertiary actions, admin panels
```tsx
<Button variant="outline">Edit</Button>
```

#### 4. **Ghost**
- Transparent background
- No border (until hover)
- Best for: Navigation, subtle actions
```tsx
<Button variant="ghost">View Details</Button>
```

#### 5. **Danger**
- Gradient: Red-900 → Red-800
- Border: Red-700
- Best for: Delete, logout, destructive actions
```tsx
<Button variant="danger">Delete</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

### With Icons

```tsx
<Button icon="✍️">Create</Button>
<Button icon="🚀" variant="primary">Launch</Button>
```

### Navigation Buttons

```tsx
// Internal navigation (React Router)
<Button to="/create">Go to Create</Button>

// External link
<Button href="https://example.com">Visit Site</Button>
```

### States

```tsx
// Disabled
<Button disabled>Can't Click</Button>

// Full width
<Button fullWidth>Take Full Width</Button>

// Button types
<Button type="submit">Submit Form</Button>
<Button type="reset">Reset</Button>
```

## Dropdown Component

Beautiful dropdown menu with grayscale styling.

### Basic Usage

```tsx
<Dropdown
  trigger={<button>Menu ▼</button>}
  items={[
    {
      label: 'Profile',
      icon: '👤',
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
    },
    {
      label: 'Logout',
      icon: '🚪',
      onClick: logout,
      variant: 'danger',
    },
  ]}
  align="right"
/>
```

### Props

- **trigger**: React node that opens the dropdown
- **items**: Array of menu items
  - `label`: Text to display
  - `icon`: Optional emoji/icon
  - `onClick`: Function to call
  - `variant`: 'default' or 'danger'
- **align**: 'left' or 'right'

## Design Features

### 🎯 Interactions
- **Hover**: Scale up (1.05x)
- **Active**: Scale down (0.95x)
- **Disabled**: Opacity 40%, no scale
- **Focus**: Visible outline

### 🎨 Styling
- **Border radius**: Full rounded (`rounded-full`)
- **Shadow**: Subtle to dramatic on hover
- **Transitions**: 300ms smooth
- **Backdrop blur**: On dropdowns

### ⚖️ Grayscale Philosophy
All buttons use only:
- Black
- Shades of gray (100-900)
- White

Except for the **danger** variant (red) for critical actions.

## Usage Examples

### Navbar
```tsx
<Button to="/create" variant="primary" icon="✍️">
  Nowa perspektywa
</Button>

<Button to="/admin" variant="outline" icon="🛡️">
  Panel
</Button>

<Dropdown
  trigger={<UserAvatar />}
  items={userMenuItems}
  align="right"
/>
```

### Forms
```tsx
<Button type="submit" variant="primary" fullWidth>
  Zaloguj się
</Button>

<Button type="button" variant="ghost" onClick={onCancel}>
  Anuluj
</Button>
```

### Empty States
```tsx
<Button to="/create" variant="primary" size="lg" icon="✍️">
  Stwórz pierwszy antystyk
</Button>
```

### Pagination
```tsx
<Button
  onClick={prevPage}
  disabled={page === 1}
  variant="primary"
  size="lg"
  icon="←"
>
  Poprzednie
</Button>
```

## Accessibility

- ✅ Keyboard navigation
- ✅ Focus states
- ✅ Disabled states
- ✅ ARIA-friendly
- ✅ Semantic HTML

## Browser Support

Works in all modern browsers with full transitions and effects.

