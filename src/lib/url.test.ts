import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl, safeExternalUrl } from './url';

describe('isSafeExternalUrl', () => {
  it('accepts http and https', () => {
    expect(isSafeExternalUrl('https://espol.edu.ec')).toBe(true);
    expect(isSafeExternalUrl('http://espol.edu.ec')).toBe(true);
  });

  it('rejects script-bearing schemes', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('JavaScript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects other non-web schemes', () => {
    expect(isSafeExternalUrl('mailto:hola@ecuadorweb3.com')).toBe(false);
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects relative and malformed values', () => {
    expect(isSafeExternalUrl('/ecosistema')).toBe(false);
    expect(isSafeExternalUrl('espol.edu.ec')).toBe(false);
    expect(isSafeExternalUrl('')).toBe(false);
  });
});

describe('safeExternalUrl', () => {
  it('passes a safe URL through unchanged', () => {
    expect(safeExternalUrl('https://espol.edu.ec')).toBe('https://espol.edu.ec');
  });

  it('drops an unsafe URL so the caller renders no link at all', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('handles a partner with no url', () => {
    expect(safeExternalUrl(undefined)).toBeUndefined();
    expect(safeExternalUrl('')).toBeUndefined();
  });
});
