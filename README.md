# simple-truncate-to-line-boundary

Truncate a byte buffer to a maximum size without ever leaving a partial line.

```js
import { truncateToLineBoundary } from './src/index.js';

const log = new TextEncoder().encode('boot\nready\nshutdown\n');
const kept = truncateToLineBoundary(log, 10);
console.log(new TextDecoder().decode(kept));
// boot\nready\n
```

## Why this exists

A byte limit is easy to enforce but hostile to line-oriented consumers. If you
cut a file at byte 10 and the tenth byte lands in the middle of a record, the
next reader sees a half-written line and either crashes or silently corrupts its
state. This library pays a small cost in retained bytes to guarantee that every
returned buffer ends on a newline boundary (or is empty).

The trade-off is deliberate: the result may be shorter than the requested
maximum, and if the allowed prefix contains no newline at all the result is the
empty buffer. That is the only cut that keeps the no-partial-line promise, and
callers who need to retain something in that case should raise their limit.

## Awkward edge

The function returns a `Uint8Array` view over the input, not a copy. That keeps
the call allocation-free, but it means the returned buffer shares memory with
the input: mutating one is visible through the other. Copy with `slice()` if you
need an independent buffer.

## API

`truncateToLineBoundary(input: Uint8Array, maxBytes: number): Uint8Array`

- `input` must be a `Uint8Array`; anything else throws a `TypeError`.
- `maxBytes` must be a non-negative integer; negatives and fractions throw a
  `RangeError`.
- The return value is always at most `maxBytes` bytes long and always ends in
  `0x0a` unless it is empty.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

