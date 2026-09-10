import { StorageService } from './storageService';
import { PaynowConfig } from '../types';

export interface PaynowInitiateParams {
  reference: string;
  amount: number;
  additionalInfo: string;
  authEmail?: string;
  phone?: string;
  paymentMethod?: 'EcoCash' | 'OneMoney' | 'InnBucks' | 'ZimSwitch' | 'Card' | 'Paynow';
}

export interface PaynowInitiateResult {
  success: boolean;
  reference: string;
  browserUrl?: string;
  pollUrl?: string;
  instructions?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface PaynowPollResult {
  status: 'Paid' | 'Created' | 'Sent' | 'Cancelled' | 'Awaiting Delivery' | 'Delivered' | 'Failed';
  reference: string;
  amount: number;
  paynowReference?: string;
  isPaid: boolean;
}

/**
 * Standard Web Crypto SHA-512 generator for Paynow signature hashing
 */
export async function generatePaynowHash(values: string[], integrationKey: string): Promise<string> {
  const concatenated = values.join('') + integrationKey;
  const msgUint8 = new TextEncoder().encode(concatenated);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export class PaynowService {
  /**
   * Retrieves active configuration from StorageService or fallback
   */
  static getConfig(): PaynowConfig {
    return StorageService.getPaynowConfig();
  }

  /**
   * Saves and activates Paynow credentials
   */
  static saveConfig(config: Partial<PaynowConfig>): PaynowConfig {
    const current = this.getConfig();
    const updated: PaynowConfig = {
      ...current,
      ...config,
      isConfigured: Boolean(config.integrationId?.trim() && config.integrationKey?.trim())
    };
    StorageService.setPaynowConfig(updated);
    return updated;
  }

  /**
   * Initiates a payment transaction via Paynow Zimbabwe
   */
  static async initiateTransaction(params: PaynowInitiateParams): Promise<PaynowInitiateResult> {
    const config = this.getConfig();
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/?payment=return&ref=${params.reference}` : 'https://gatewayzim.org/payment/return';
    const resultUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/paynow/callback` : 'https://gatewayzim.org/api/paynow/callback';
    const authEmail = params.authEmail || config.merchantEmail || 'gatewaychurchzim@gmail.com';

    // Never claim a payment succeeded without a configured merchant gateway.
    if (!config.isConfigured || !config.integrationId || !config.integrationKey) {
      console.warn('[PAYNOW] Credentials are not configured. Payment initiation was refused.');
      return {
        success: false,
        reference: params.reference,
        error: 'Paynow is not configured. Add the live Integration ID and Integration Key before accepting payments.'
      };
    }

    try {
      // Step 1: Format parameters according to Paynow interface specifications
      const id = config.integrationId.trim();
      const reference = params.reference.trim();
      const amount = params.amount.toFixed(2);
      const additionalinfo = params.additionalInfo.trim() || 'Gateway Church Ministry Partner';
      const status = 'Message';

      // Step 2: Calculate SHA-512 hash in exact field order
      // Paynow requires: id, reference, amount, additionalinfo, returnurl, resulturl, authemail, status
      const hashValues = [id, reference, amount, additionalinfo, returnUrl, resultUrl, authEmail, status];
      const hash = await generatePaynowHash(hashValues, config.integrationKey.trim());

      const payload = new URLSearchParams({
        id,
        reference,
        amount,
        additionalinfo,
        returnurl: returnUrl,
        resulturl: resultUrl,
        authemail: authEmail,
        status,
        hash
      });

      // Try server-side proxy route first if available, otherwise direct call
      const endpoint = '/api/paynow/initiate';
      let response: Response;

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integrationId: id,
            integrationKey: config.integrationKey.trim(),
            reference,
            amount: params.amount,
            additionalInfo: additionalinfo,
            returnUrl,
            resultUrl,
            authEmail,
            phone: params.phone,
            method: params.paymentMethod
          })
        });
      } catch (networkError) {
        // Direct browser fallback call
        response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString()
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Paynow HTTP Error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const jsonResult = await response.json();
        return jsonResult;
      }

      const rawText = await response.text();
      const responseParams = new URLSearchParams(rawText);
      const respStatus = responseParams.get('status');

      if (respStatus?.toLowerCase() === 'ok') {
        const browserUrl = responseParams.get('browserurl') || undefined;
        const pollUrl = responseParams.get('pollurl') || undefined;

        return {
          success: true,
          reference,
          browserUrl,
          pollUrl,
          instructions: `Payment request initialized on Paynow for ${params.paymentMethod || 'EcoCash'}. Reference: ${reference}`
        };
      } else {
        const errorDetail = responseParams.get('error') || 'Paynow could not authorize the transaction. Please verify your Integration ID and Key.';
        return {
          success: false,
          reference,
          error: errorDetail
        };
      }
    } catch (e: any) {
      console.error('[PAYNOW] Error initiating transaction:', e);
      // Do not convert a gateway/network failure into a successful payment.
      return {
        success: false,
        reference: params.reference,
        error: e.message || 'Unable to reach Paynow. No payment was recorded.'
      };
    }
  }

  /**
   * Polls Paynow for the status of an ongoing transaction
   */
  static async pollStatus(pollUrl: string): Promise<PaynowPollResult> {
    try {
      // Try local proxy poll endpoint first to avoid CORS in browser
      let response: Response;
      try {
        response = await fetch(`/api/paynow/poll?url=${encodeURIComponent(pollUrl)}`);
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (err) {
        // Fallback to direct poll
      }

      response = await fetch(pollUrl);
      const text = await response.text();
      const params = new URLSearchParams(text);

      const status = (params.get('status') as PaynowPollResult['status']) || 'Created';
      const reference = params.get('reference') || '';
      const amount = parseFloat(params.get('amount') || '0');
      const paynowReference = params.get('paynowreference') || undefined;

      return {
        status,
        reference,
        amount,
        paynowReference,
        isPaid: status.toLowerCase() === 'paid'
      };
    } catch (e) {
      return {
        status: 'Sent',
        reference: '',
        amount: 0,
        isPaid: false
      };
    }
  }
}
