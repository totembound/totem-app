/**
 * sigv4 tests
 */
import { describe, it, expect } from 'vitest';
import { signIoTWebSocketUrl } from './sigv4';

describe('signIoTWebSocketUrl', () => {
  it('should generate a pre-signed wss:// URL', async () => {
    const url = await signIoTWebSocketUrl(
      'xxx-ats.iot.us-east-1.amazonaws.com',
      'us-east-1',
      'AKIAIOSFODNN7EXAMPLE',
      'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      'session-token-123',
    );

    expect(url).toMatch(/^wss:\/\/xxx-ats\.iot\.us-east-1\.amazonaws\.com\/mqtt\?/);
    expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(url).toContain('X-Amz-Credential=');
    expect(url).toContain('X-Amz-Date=');
    expect(url).toContain('X-Amz-SignedHeaders=host');
    expect(url).toContain('X-Amz-Signature=');
    expect(url).toContain('X-Amz-Security-Token=');
  });

  it('should include the endpoint in the URL', async () => {
    const endpoint = 'custom-endpoint.iot.eu-west-1.amazonaws.com';
    const url = await signIoTWebSocketUrl(
      endpoint,
      'eu-west-1',
      'AKID',
      'SECRET',
      'TOKEN',
    );

    expect(url).toContain(endpoint);
  });

  it('should URL-encode the session token', async () => {
    const token = 'token/with+special=chars';
    const url = await signIoTWebSocketUrl(
      'test.iot.us-east-1.amazonaws.com',
      'us-east-1',
      'AKID',
      'SECRET',
      token,
    );

    expect(url).toContain(encodeURIComponent(token));
    expect(url).not.toContain('token/with+special=chars');
  });

  it('should include region in the credential scope', async () => {
    const url = await signIoTWebSocketUrl(
      'test.iot.us-west-2.amazonaws.com',
      'us-west-2',
      'AKID',
      'SECRET',
      'TOKEN',
    );

    expect(url).toContain('us-west-2');
    expect(url).toContain('iotdevicegateway');
  });

  it('should produce a valid hex signature (64 chars)', async () => {
    const url = await signIoTWebSocketUrl(
      'test.iot.us-east-1.amazonaws.com',
      'us-east-1',
      'AKID',
      'SECRET',
      'TOKEN',
    );

    const sigMatch = url.match(/X-Amz-Signature=([a-f0-9]+)/);
    expect(sigMatch).not.toBeNull();
    expect(sigMatch![1]).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it('should produce different signatures for different keys', async () => {
    const url1 = await signIoTWebSocketUrl('test.iot.us-east-1.amazonaws.com', 'us-east-1', 'AKID1', 'SECRET1', 'TOKEN');
    const url2 = await signIoTWebSocketUrl('test.iot.us-east-1.amazonaws.com', 'us-east-1', 'AKID2', 'SECRET2', 'TOKEN');

    const sig1 = url1.match(/X-Amz-Signature=([a-f0-9]+)/)![1];
    const sig2 = url2.match(/X-Amz-Signature=([a-f0-9]+)/)![1];

    expect(sig1).not.toBe(sig2);
  });
});
