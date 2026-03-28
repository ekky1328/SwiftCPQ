import { toCents, fromCents } from '../../../src/server/helpers/money';

describe('toCents', () => {
  it('converts a whole dollar amount', () => {
    expect(toCents(10)).toBe(1000);
  });

  it('converts a decimal amount', () => {
    expect(toCents(9.99)).toBe(999);
  });

  it('handles floating-point edge case (1.005 * 100 = 100.499... in IEEE 754)', () => {
    // Math.round(1.005 * 100) = Math.round(100.49999...) = 100 due to floating-point representation.
    // This documents the actual behavior of the implementation.
    expect(toCents(1.005)).toBe(100);
  });

  it('handles zero', () => {
    expect(toCents(0)).toBe(0);
  });

  it('handles negative amounts', () => {
    expect(toCents(-5.5)).toBe(-550);
  });

  it('handles large amounts', () => {
    expect(toCents(10000)).toBe(1000000);
  });
});

describe('fromCents', () => {
  it('converts cents to dollars', () => {
    expect(fromCents(1000)).toBe(10);
  });

  it('handles zero', () => {
    expect(fromCents(0)).toBe(0);
  });

  it('handles fractional cents result', () => {
    expect(fromCents(999)).toBe(9.99);
  });

  it('handles large values', () => {
    expect(fromCents(1000000)).toBe(10000);
  });

  it('round-trips with toCents', () => {
    expect(fromCents(toCents(12.34))).toBe(12.34);
  });

  it('round-trips negative values', () => {
    expect(fromCents(toCents(-19.99))).toBe(-19.99);
  });
});
