import crypto from 'node:crypto';

export const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || '07b7ce25fe9156b5dffcd1204e5247f1',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '0d0a5e8feaaec69096791bf293f9ef24',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '0dc20760ab50f83dd74431a4ca9ea5c7774c4e7da20188981f7ba8da6b08e50b',
  bucketName: process.env.R2_BUCKET_NAME || 'joedaniels-media',
  region: 'auto'
};

export async function r2Request(
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD',
  key: string,
  body: Buffer | string | null = null,
  contentType: string = 'application/json'
): Promise<Response> {
  const host = `${R2_CONFIG.accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${R2_CONFIG.bucketName}/${encodeURI(key)}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadBuf = body 
    ? (Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))) 
    : Buffer.alloc(0);
  const payloadHash = crypto.createHash('sha256').update(payloadBuf).digest('hex');

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };

  if (method === 'PUT' && contentType) {
    headers['content-type'] = contentType;
  }

  const sortedKeys = Object.keys(headers).sort();
  const signedHeaders = sortedKeys.join(';');
  const canonicalHeaders = sortedKeys.map(k => `${k}:${headers[k]}\n`).join('');
  const canonicalRequest = `${method}\n/${R2_CONFIG.bucketName}/${encodeURI(key)}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const hashedCanonicalReq = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedCanonicalReq}`;

  function hmac(k: Buffer | string, val: string): Buffer {
    return crypto.createHmac('sha256', k).update(val).digest();
  }

  const kDate = hmac(`AWS4${R2_CONFIG.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${R2_CONFIG.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return await fetch(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : payloadBuf
  });
}

export async function getR2Json<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await r2Request('GET', key);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`R2 GET error for ${key}:`, err);
    return fallback;
  }
}

export async function putR2Json(key: string, data: unknown): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const res = await r2Request('PUT', key, jsonStr, 'application/json');
    return res.ok;
  } catch (err) {
    console.error(`R2 PUT error for ${key}:`, err);
    return false;
  }
}
