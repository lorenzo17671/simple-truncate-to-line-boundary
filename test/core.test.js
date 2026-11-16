import test from 'node:test';
import assert from 'node:assert/strict';
import { truncateToLineBoundary } from '../src/index.js';

const bytes = (s) => new TextEncoder().encode(s);
const str = (b) => new TextDecoder().decode(b);

test('returns the whole input when it already ends in a newline', () => {
  const input = bytes('alpha\nbeta\n');
  const out = truncateToLineBoundary(input, 100);
  assert.equal(str(out), 'alpha\nbeta\n');
});

test('cuts exactly at maxBytes when that byte is a newline', () => {
  const input = bytes('alpha\nbeta\n');
  const out = truncateToLineBoundary(input, 6);
  assert.equal(str(out), 'alpha\n');
});

test('backs up to the previous newline when the cut splits a line', () => {
  const input = bytes('alpha\nbeta\ngamma\n');
  const out = truncateToLineBoundary(input, 8);
  assert.equal(str(out), 'alpha\n');
});

test('returns empty when no newline fits in the allowed prefix', () => {
  const input = bytes('alpha beta gamma');
  const out = truncateToLineBoundary(input, 5);
  assert.equal(str(out), '');
});

test('returns empty for maxBytes of zero', () => {
  const input = bytes('alpha\nbeta\n');
  const out = truncateToLineBoundary(input, 0);
  assert.equal(out.length, 0);
});

test('returns empty for empty input', () => {
  const input = new Uint8Array(0);
  const out = truncateToLineBoundary(input, 10);
  assert.equal(out.length, 0);
});

test('handles input that is a single newline', () => {
  const input = bytes('\n');
  const out = truncateToLineBoundary(input, 1);
  assert.equal(str(out), '\n');
});

test('does not mutate the input buffer', () => {
  const input = bytes('alpha\nbeta\n');
  const copy = input.slice();
  truncateToLineBoundary(input, 3);
  assert.deepEqual(input, copy);
});

test('result is a view sharing memory with the input', () => {
  const input = bytes('alpha\nbeta\n');
  const out = truncateToLineBoundary(input, 6);
  assert.equal(out.buffer, input.buffer);
  assert.equal(out.byteOffset, input.byteOffset);
});

test('treats a lone carriage return as part of the line, not a terminator', () => {
  const input = bytes('alpha\r\nbeta\r\n');
  // maxBytes 7 cuts between \r and \n; we must back up to the \r\n pair.
  const out = truncateToLineBoundary(input, 7);
  assert.equal(str(out), 'alpha\r\n');
});

test('rejects non-Uint8Array input', () => {
  assert.throws(() => truncateToLineBoundary('alpha\n', 5), TypeError);
});

test('rejects negative or fractional maxBytes', () => {
  const input = bytes('alpha\n');
  assert.throws(() => truncateToLineBoundary(input, -1), RangeError);
  assert.throws(() => truncateToLineBoundary(input, 1.5), RangeError);
});
