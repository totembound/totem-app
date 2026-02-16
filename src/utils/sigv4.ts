/**
 * AWS SigV4 URL Signing for IoT Core WebSocket connections
 *
 * Creates a pre-signed WSS URL for MQTT over WebSocket using the
 * Web Crypto API (no Node.js dependencies — works in all browsers).
 *
 * Reference: https://docs.aws.amazon.com/iot/latest/developerguide/mqtt-ws.html
 */

// ============================================================================
// Crypto helpers (Web Crypto API)
// ============================================================================

async function sha256(data: string): Promise<string> {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer | Uint8Array, data: string): Promise<string> {
  const result = await hmac(key, data);
  return bufferToHex(result);
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${key}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a SigV4 pre-signed WebSocket URL for AWS IoT Core MQTT.
 *
 * @param endpoint - IoT Core endpoint (e.g. "xxx-ats.iot.us-east-1.amazonaws.com")
 * @param region - AWS region (e.g. "us-east-1")
 * @param accessKeyId - STS temporary access key
 * @param secretKey - STS temporary secret key
 * @param sessionToken - STS session token
 * @returns Pre-signed wss:// URL
 */
export async function signIoTWebSocketUrl(
  endpoint: string,
  region: string,
  accessKeyId: string,
  secretKey: string,
  sessionToken: string,
): Promise<string> {
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';

  const service = 'iotdevicegateway';
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const algorithm = 'AWS4-HMAC-SHA256';

  // Empty body hash (SHA-256 of "")
  const emptyBodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalQuerystring = [
    `X-Amz-Algorithm=${algorithm}`,
    `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${scope}`)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-SignedHeaders=host`,
  ].sort().join('&');

  const canonicalRequest = [
    'GET',
    '/mqtt',
    canonicalQuerystring,
    `host:${endpoint}\n`,
    'host',
    emptyBodyHash,
  ].join('\n');

  const canonicalRequestHash = await sha256(canonicalRequest);

  const stringToSign = [
    algorithm,
    amzDate,
    scope,
    canonicalRequestHash,
  ].join('\n');

  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  return `wss://${endpoint}/mqtt?${canonicalQuerystring}&X-Amz-Signature=${signature}&X-Amz-Security-Token=${encodeURIComponent(sessionToken)}`;
}
