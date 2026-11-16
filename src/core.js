const NEWLINE = 0x0a;

/**
 * Truncate a buffer to at most maxBytes bytes, backing up to the nearest
 * newline so that no line is split in half.
 *
 * The returned buffer always ends with a newline unless the input contains no
 * newline at all within the allowed size, in which case the empty buffer is
 * returned. This "no partial line" rule is the whole point: consuming a
 * truncated file with a line-oriented parser should never see a half-written
 * record.
 *
 * maxBytes is an upper bound on the returned byte length. If the byte at
 * maxBytes - 1 is already a newline the buffer is returned unchanged. Otherwise
 * we scan backwards for the previous newline and cut immediately after it.
 *
 * @param {Uint8Array} input bytes to truncate
 * @param {number} maxBytes maximum number of bytes to keep
 * @returns {Uint8Array} a subarray view of input, length <= maxBytes
 */
export function truncateToLineBoundary(input, maxBytes) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError('input must be a Uint8Array');
  }
  if (!Number.isInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError('maxBytes must be a non-negative integer');
  }
  if (maxBytes === 0 || input.length === 0) {
    return input.subarray(0, 0);
  }
  const limit = Math.min(maxBytes, input.length);
  // Fast path: the last byte we are allowed to keep is already a line
  // terminator, so the cut is exactly at the boundary.
  if (input[limit - 1] === NEWLINE) {
    return input.subarray(0, limit);
  }
  for (let i = limit - 1; i >= 0; i--) {
    if (input[i] === NEWLINE) {
      return input.subarray(0, i + 1);
    }
  }
  // No newline anywhere in the allowed prefix. Returning the empty buffer is
  // the only way to honour the no-partial-line guarantee.
  return input.subarray(0, 0);
}
