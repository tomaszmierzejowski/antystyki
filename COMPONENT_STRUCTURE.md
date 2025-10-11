# Antystyki UI Component Structure

## Page Layout Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Navbar.tsx                           │  │
│  │  ┌─────────┐  Główna  Dodaj  Topka  O nas  antystyki.pl │  │
│  │  │ 🔘 Logo │                                              │  │
│  │  └─────────┘                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   HeroSection.tsx                         │  │
│  │                                                           │  │
│  │         Świat nie jest czarno-biały                      │  │
│  │                                                           │  │
│  │   Odkrywaj odcienie prawdy. Zatrzymaj polaryzację...    │  │
│  │                                                           │  │
│  │   [ Dodaj Antystyk ]  [ Dowiedz się więcej ]           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   TagFilterBar.tsx                        │  │
│  │                                                           │  │
│  │  [Wszystkie] [Społeczeństwo] [Technologia] [Search🔍]   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  AntisticCard.tsx (1)                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ 92.4% wypadków drogowych powodują trzeźwi...       │  │  │
│  │  ├─────────────────────┬──────────────────────────────┤  │  │
│  │  │ Perspektywa Antyst. │ Dane źródłowe               │  │  │
│  │  │                     │                              │  │  │
│  │  │      ⭕ 92%         │      🟧 7%                  │  │  │
│  │  │    Gray Chart       │      🟦 28%                 │  │  │
│  │  │                     │      🟩 25%                 │  │  │
│  │  │                     │      🟪 18% ...             │  │  │
│  │  ├─────────────────────┴──────────────────────────────┤  │  │
│  │  │ Context paragraph explaining the statistic...      │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │ 👍 247 Lubię to  💬 45 Udostępnij   antystyki.pl │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  AntisticCard.tsx (2)                     │  │
│  │                      [...]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  AntisticCard.tsx (3)                     │  │
│  │                      [...]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                LoadMoreButton.tsx                         │  │
│  │                [ Załaduj więcej ]                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Footer.tsx                            │  │
│  │  ┌─────────────┬─────────────┬─────────────────────────┐ │  │
│  │  │ 🔘 Logo     │ Nawigacja   │ Informacje              │ │  │
│  │  │ Antystyki   │             │                         │ │  │
│  │  │             │ • Główna    │ • Polityka prywatności  │ │  │
│  │  │ Mission     │ • Dodaj     │ • Regulamin             │ │  │
│  │  │ statement   │ • Topka     │ • Kontakt               │ │  │
│  │  │             │ • O nas     │ • FAQ                   │ │  │
│  │  └─────────────┴─────────────┴─────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Dependency Tree

```
App.tsx
├── Navbar.tsx
│   └── (No sub-components)
│
└── Home.tsx
    ├── HeroSection.tsx
    │   └── (Static content, buttons)
    │
    ├── TagFilterBar.tsx
    │   ├── Category filter pills
    │   └── Search input (optional)
    │
    ├── AntisticCard.tsx (multiple instances)
    │   ├── DoughnutChart (left column)
    │   │   └── SVG circle chart
    │   │
    │   ├── ColorfulDataChart (right column)
    │   │   ├── SVG multi-segment circle
    │   │   └── Legend
    │   │
    │   └── Interaction bar (likes, share, watermark)
    │
    ├── LoadMoreButton.tsx
    │   └── (Button with loading state)
    │
    └── Footer.tsx
        └── Three-column grid layout
```

---

## Component Props & Interfaces

### Navbar.tsx
```typescript
// No props - uses Auth context
const Navbar: React.FC = () => { ... }
```

### HeroSection.tsx
```typescript
// No props - static content
const HeroSection: React.FC = () => { ... }
```

### TagFilterBar.tsx
```typescript
interface Props {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}
```

### AntisticCard.tsx
```typescript
interface Props {
  antistic: Antistic;
}

// Sub-components:
const DoughnutChart: React.FC<{
  percentage: number;
  color: string;
  label: string;
}>

const ColorfulDataChart: React.FC<{
  segments: Array<{
    label: string;
    percentage: number;
    color: string;
  }>;
}>
```

### LoadMoreButton.tsx
```typescript
interface Props {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}
```

### Footer.tsx
```typescript
// No props - static content with links
const Footer: React.FC = () => { ... }
```

---

## Data Flow

```
┌─────────────┐
│   App.tsx   │
│             │
│ AuthContext │
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
┌──────▼──────┐      ┌──────▼──────┐
│  Navbar     │      │   Home      │
│             │      │             │
│ Uses Auth   │      │ Fetches:    │
│ Context     │      │ • Antistics │
└─────────────┘      │ • Categories│
                     └──────┬──────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
         ┌──────▼──────┐    │    ┌─────▼────────┐
         │ TagFilterBar│    │    │ AntisticCard │
         │             │    │    │   (Array)    │
         │ Receives:   │    │    │              │
         │ • categories│    │    │ Receives:    │
         │ • selected  │    │    │ • antistic   │
         │             │    │    │              │
         │ Emits:      │    │    │ Displays:    │
         │ • onSelect  │    │    │ • Charts     │
         │ • onSearch  │    │    │ • Content    │
         └─────────────┘    │    └──────────────┘
                            │
                     ┌──────▼──────┐
                     │LoadMoreBtn  │
                     │             │
                     │ onClick →   │
                     │ Fetch more  │
                     └─────────────┘
```

---

## Styling Architecture

### Utility-First Approach (Tailwind CSS)
- All styling done with Tailwind utility classes
- No inline styles
- No CSS modules
- No styled-components

### Theme Configuration
```
theme.ts (Design Tokens)
      ↓
tailwind.config.js (Tailwind Extension)
      ↓
Component Classes (Utility Classes)
```

### Color System
```
Colors are defined in two places:

1. theme.ts (for reference)
   - background: '#f8f9fb'
   - card: '#ffffff'
   - accent: '#FF6A00'
   - etc.

2. tailwind.config.js (for usage)
   - className="bg-background"
   - className="bg-accent"
   - className="text-gray-600"
```

---

## Responsive Breakpoints

```
Mobile (<640px)
├── Single column layout
├── Stacked navigation
└── Simplified cards

Tablet (640px - 1024px)
├── Optimized spacing
├── Two-column charts in cards
└── Horizontal navigation

Desktop (>1024px)
├── Max-width container (1000px)
├── Full layout
└── Generous whitespace
```

---

## State Management

### Local State (Home.tsx)
```typescript
const [antistics, setAntistics] = useState<Antistic[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('');
```

### Global State (AuthContext)
```typescript
// Used by Navbar and other components
const { user, logout, isAuthenticated } = useAuth();
```

---

## Key Interactions

1. **Filter Selection**
   ```
   User clicks pill → onCategorySelect(id) → Home updates state → API fetch → Cards update
   ```

2. **Search**
   ```
   User types → onSearch(query) → Home updates state → API fetch → Cards update
   ```

3. **Load More**
   ```
   User clicks → onClick() → Home increments page → API fetch → New cards added
   ```

4. **Navigation**
   ```
   User clicks link → React Router → Page change
   ```

---

## Performance Considerations

### Optimizations Applied
- ✅ Fade-in animations with staggered delay
- ✅ Single-column layout for better performance
- ✅ Lazy loading via pagination
- ✅ Minimal re-renders with proper state management
- ✅ Optimized SVG charts (no heavy libraries)

### Future Optimizations
- [ ] React.memo for cards
- [ ] Virtual scrolling for long lists
- [ ] Image lazy loading
- [ ] Code splitting by route
- [ ] Service worker for caching

---

## Testing Strategy

### Unit Tests
- [ ] Component rendering
- [ ] Props validation
- [ ] Event handlers
- [ ] State updates

### Integration Tests
- [ ] Page navigation
- [ ] Filter functionality
- [ ] Search functionality
- [ ] Load more pagination

### Visual Tests
- [ ] Screenshot comparison
- [ ] Cross-browser rendering
- [ ] Responsive design
- [ ] Animation smoothness

---

## Summary

The component structure follows a clear hierarchy with proper separation of concerns:

- **Navbar**: Global navigation (sticky)
- **HeroSection**: Landing content
- **TagFilterBar**: Filtering UI
- **AntisticCard**: Content display (repeatable)
- **LoadMoreButton**: Pagination
- **Footer**: Site info (static)

All components use:
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Router for navigation
- ✅ Proper props and interfaces
- ✅ Semantic HTML structure

The design is clean, minimal, and matches the mockup perfectly! 🎉

