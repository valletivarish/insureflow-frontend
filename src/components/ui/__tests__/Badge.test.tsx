import { describe, expect, it } from 'vitest';

import { Badge } from '../Badge';

describe('Badge', () => {
  it('composes success variant class name', () => {
    const element = Badge({ variant: 'success', children: 'Approved' } as never);
    expect(element.props.className).toContain('success');
  });
});
