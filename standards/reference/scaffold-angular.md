# Scaffolds: Angular

Read when creating a component, service, or feature. Rules live in
`framework/angular.md` — this file is shapes and paths only.

## Component

```ts
@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-profile.component.html',
})
export class UserProfileComponent {
  readonly user = input.required<User>()
  readonly select = output<string>()
  protected readonly displayName = computed(() => formatName(this.user()))
}
```

File `user-profile.component.ts` → class `UserProfileComponent`.

## Signal store

```ts
@Injectable({ providedIn: 'root' })
export class FeatureStore {
  private readonly _data = signal<Feature[]>([])
  readonly data = this._data.asReadonly()
  readonly loading = signal(false)
  readonly totalCount = computed(() => this._data().length)

  handleSearch(value: string): void { /* ... */ }
  handleFilterChange(filters: Partial<FeatureFilters>): void { /* ... */ }
}
```

Expose readonly signals; mutate only through methods.

## Feature structure

```text
src/app/features/{feature}/
├── components/feature-table/feature-table.component.ts
├── feature.store.ts
├── feature.service.ts
├── models/feature.model.ts
└── feature-page/feature-page.component.ts
```

## Models

```ts
export interface Feature {
  id: string
}

export interface FeatureFilters {
  search: string
}
```
