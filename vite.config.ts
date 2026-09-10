import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import crypto from 'crypto';
import {defineConfig} from 'vite';

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
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
