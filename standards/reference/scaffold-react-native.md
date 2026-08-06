# Scaffolds: React Native

Read when creating a component, screen, or feature. Rules live in
`framework/react-native.md` — this file is shapes and paths only.

## Component

```tsx
export function FeatureCard({ item, onSelect }: FeatureCardProps) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      accessibilityRole="button"
      accessibilityLabel={t('feature.selectItem', { name: item.name })}
      style={styles.card}
    >
      <Text style={styles.title}>{item.name}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  title: { fontSize: 16 },
})
```

`StyleSheet.create` at module scope — never build a style object inside render.
Every touchable needs `accessibilityRole` and an `accessibilityLabel`.

## List screen

```tsx
const renderItem = ({ item }: { item: Feature }) => <FeatureCard item={item} onSelect={handleSelect} />

<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
/>
```

`renderItem` points at a memoized component defined outside the parent.

## Controller hook

Same shape as React on web, plus a timeout, a retry policy, and an offline state.

## Feature structure

```text
src/features/{feature}/
├── components/FeatureCard/FeatureCard.tsx
├── utils/types.ts
├── useFeatureController.ts
└── FeatureScreen.tsx
```

Platform variants as `.ios.tsx` / `.android.tsx` siblings.
