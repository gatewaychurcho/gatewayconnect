import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import crypto from 'crypto';
import {defineConfig} from 'vite';
import { CONFIG } from './config';

// Paynow SHA-512 Generator for server-side signing
function generateServerPaynowHash(values: string[], integrationKey: string): string {
  const concatenated = values.join('') + integrationKey;
  return crypto.createHash('sha512').update(concatenated, 'utf8').digest('hex').toUpperCase();
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'paynow-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/paynow/health', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            const integrationId = CONFIG.PAYNOW_INTEGRATION_ID;
            const integrationKey = CONFIG.PAYNOW_INTEGRATION_KEY;
            res.end(JSON.stringify({
              success: true,
              configured: Boolean(integrationId && integrationKey),
              integrationId: integrationId || undefined,
              status: 'healthy'
            }));
          });

          server.middlewares.use('/api/paynow/initiate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', chunk => {
              bodyStr += chunk;
            });

            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const data = JSON.parse(bodyStr || '{}');
                const {
                  integrationId,
                  integrationKey,
                  reference,
                  amount,
                  additionalInfo,
                  returnUrl,
                  resultUrl,
                  authEmail,
                  phone,
                  method
                } = data;

                // If live credentials provided, call Paynow API server-to-server (bypassing CORS)
                if (integrationId && integrationKey && integrationId !== '12345') {
                  const amtStr = Number(amount || 0).toFixed(2);
                  const isMobileExpress = Boolean(phone && (method === 'EcoCash' || method === 'OneMoney'));
                  
                  const values = [
                    String(integrationId).trim(),
                    String(reference).trim(),
                    amtStr,
                    String(additionalInfo || 'Gateway Church Ministry').trim(),
                    String(returnUrl || '').trim(),
                    String(resultUrl || '').trim(),
                    String(authEmail || 'gatewaychurchzim@gmail.com').trim(),
                    'Message'
                  ];

                  const hash = generateServerPaynowHash(values, String(integrationKey).trim());
                  
                  const paynowParams = new URLSearchParams({
                    id: String(integrationId).trim(),
                    reference: String(reference).trim(),
                    amount: amtStr,
                    additionalinfo: String(additionalInfo || 'Gateway Church Ministry').trim(),
                    returnurl: String(returnUrl || '').trim(),
                    resulturl: String(resultUrl || '').trim(),
                    authemail: String(authEmail || 'gatewaychurchzim@gmail.com').trim(),
                    status: 'Message',
                    hash
                  });

                  if (isMobileExpress) {
                    paynowParams.append('phone', String(phone).trim());
                    paynowParams.append('method', method.toLowerCase() === 'onemoney' ? 'onemoney' : 'ecocash');
                  }

                  const targetUrl = isMobileExpress 
                    ? 'https://www.paynow.co.zw/interface/remotetransaction'
                    : 'https://www.paynow.co.zw/interface/initiatetransaction';

                  const paynowResponse = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: paynowParams.toString()
                  });

                  const rawResp = await paynowResponse.text();
                  const respParams = new URLSearchParams(rawResp);
                  const status = respParams.get('status');

                  if (status && status.toLowerCase() === 'ok') {
                    const browserUrl = respParams.get('browserurl') || undefined;
                    const pollUrl = respParams.get('pollurl') || undefined;
                    const instructions = respParams.get('instructions') || 
                      (isMobileExpress 
                        ? `USSD prompt dispatched to ${phone}. Please check your phone and enter your ${method} PIN.` 
                        : `Payment session initialized. Proceed to Paynow gateway.`);

                    res.statusCode = 200;
                    res.end(JSON.stringify({
                      success: true,
                      reference,
                      browserUrl,
                      pollUrl,
                      instructions
                    }));
                    return;
                  } else {
                    const errorMsg = respParams.get('error') || 'Paynow authorization declined. Check your credentials.';
                    res.statusCode = 200;
                    res.end(JSON.stringify({
                      success: false,
                      reference,
                      error: errorMsg
                    }));
                    return;
                  }
                }

                // Demonstration / Test Mode fallback with accurate EcoCash details
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  reference,
                  isSimulated: true,
                  browserUrl: `https://www.paynow.co.zw/Payment/ConfirmPaymentDemo?ref=${reference}&amt=${amount}`,
                  instructions: `Demo Mode: EcoCash USSD prompt sent to ${phone || '0772123456'} for $${amount}. Dial *151# to confirm on your device. Configure live Paynow credentials in Settings for automatic bank settlement.`
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({
                  success: false,
                  error: err.message || 'Internal server error processing Paynow transaction'
                }));
              }
            });
          });

          server.middlewares.use('/api/paynow/poll', async (req, res) => {
            const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
            const pollUrl = urlObj.searchParams.get('url');

            if (!pollUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing poll url parameter' }));
              return;
            }

            try {
              const resp = await fetch(pollUrl);
              const text = await resp.text();
              const params = new URLSearchParams(text);
              const status = params.get('status') || 'Created';

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status,
                reference: params.get('reference') || '',
                amount: parseFloat(params.get('amount') || '0'),
                paynowReference: params.get('paynowreference') || undefined,
                isPaid: status.toLowerCase() === 'paid'
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'Error', error: err.message }));
            }
          });

          // Facebook Video / Live Link Resolver
          server.middlewares.use('/api/facebook/resolve', async (req, res) => {
            const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
            let targetUrl = urlObj.searchParams.get('url');

            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              await new Promise(resolve => req.on('end', resolve));
              try {
                const parsed = JSON.parse(body || '{}');
                if (parsed.url) targetUrl = parsed.url;
              } catch {}
            }

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Missing url parameter' }));
              return;
            }

            try {
              targetUrl = targetUrl.trim();
              const userAgent = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
              const response = await fetch(targetUrl, {
                headers: {
                  'User-Agent': userAgent,
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                redirect: 'follow'
              });

              const resolvedUrl = response.url || targetUrl;
              const html = await response.text();

              // Extract numeric video ID
              const idMatch = resolvedUrl.match(/\/(?:videos|reel)\/(?:[^\/]+\/)?(\d{8,25})/) ||
                              resolvedUrl.match(/[?&]v=(\d{8,25})/) ||
                              html.match(/\/(?:videos|reel)\/(?:[^\/]+\/)?(\d{8,25})/) ||
                              html.match(/"video_id":"(\d{8,25})"/);

              const numericVideoId = idMatch ? idMatch[1] : undefined;

              // Extract OpenGraph meta tags
              const titleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']*)["']/i) ||
                                 html.match(/<title>([^<]*)<\/title>/i);
              let title = titleMatch ? titleMatch[1] : undefined;
              if (title) {
                title = title
                  .replace(/&amp;/g, '&')
                  .replace(/&#xb7;/g, '·')
                  .replace(/&quot;/g, '"')
                  .replace(/^\d+(\.\d+)?[KM]?\s+views\s+·\s+\d+\s+reactions\s+\|\s+/i, '')
                  .trim();
              }

              const descMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']*)["']/i);
              let description = descMatch ? descMatch[1] : undefined;
              if (description) {
                description = description.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
              }

              const imgMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']*)["']/i);
              const thumbnailUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : undefined;

              // Generate canonical and embed URL
              const canonicalUrl = numericVideoId
                ? `https://www.facebook.com/watch/?v=${numericVideoId}`
                : resolvedUrl;
              
              const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=0&width=500`;

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                originalUrl: targetUrl,
                resolvedUrl,
                canonicalUrl,
                embedUrl,
                numericVideoId,
                title: title || 'Apostolic Broadcast with Apostle Joe Daniels',
                description: description || 'Gateway Church Zimbabwe Live Altar',
                thumbnailUrl,
                author: 'Apostle Joe Daniels'
              }));
            } catch (err: any) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                originalUrl: targetUrl,
                resolvedUrl: targetUrl,
                canonicalUrl: targetUrl,
                embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetUrl)}&show_text=0&width=500`,
                error: err.message
              }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: CONFIG.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: CONFIG.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

