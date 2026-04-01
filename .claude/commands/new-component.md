# New Component

Scaffold a new React component.

## Usage
/new-component [ComponentName] [description]

Example: /new-component PriceHistory Show a sparkline of price history for a comp

## What to do

1. Create `components/[ComponentName].tsx`
2. Use named export: `export function ComponentName({ ... }: Props) {}`
3. Props interface at top of file, typed strictly
4. Tailwind for layout/spacing, inline styles only for dynamic values
5. Framer Motion if the component has enter/exit animation
6. No useState for data that belongs in FindSessionContext

## Component checklist
- [ ] Mobile-first (works at 390px width)
- [ ] Dark theme colors (see CLAUDE.md design tokens)
- [ ] `whileTap={{ scale: 0.97 }}` on any tappable element
- [ ] Accessible: meaningful aria-labels on icon-only buttons
- [ ] Export added to relevant page import

## Common patterns

### Card wrapper
```tsx
<div style={{ background: 'rgba(13,31,13,0.5)', border: '1px solid rgba(109,188,109,0.12)', borderRadius: 12 }}>
```

### Section header
```tsx
<h2 className="font-serif text-[#f5f0e8] text-lg">Title</h2>
```

### Price/number
```tsx
<span className="font-mono text-[#c8b47e]">{formatCurrency(price)}</span>
```
