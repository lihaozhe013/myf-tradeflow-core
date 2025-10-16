declare module './pages/*' {
  import type { ComponentType } from 'react';

  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}

declare module '@/pages/*' {
  import type { ComponentType } from 'react';

  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}
