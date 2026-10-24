import { describe, expect, it } from 'vitest';
import { NIGERIAN_STATES } from '../src/data/nigerianStates';
import { NigerianStateEnum } from '../src/server/schemas/commerce';

describe('Nigerian delivery states', () => {
  it('contains all 36 states plus the Federal Capital Territory', () => {
    expect(NIGERIAN_STATES).toHaveLength(37);
    expect(new Set(NIGERIAN_STATES).size).toBe(37);
    expect(NIGERIAN_STATES).toContain('Lagos State');
    expect(NIGERIAN_STATES).toContain('Zamfara State');
    expect(NIGERIAN_STATES).toContain('Abuja (FCT)');
    expect(NIGERIAN_STATES).not.toContain('Other Nigerian State');
  });

  it('accepts every listed state in server-side validation', () => {
    for (const state of NIGERIAN_STATES) {
      expect(NigerianStateEnum.safeParse(state).success).toBe(true);
    }
  });
});
