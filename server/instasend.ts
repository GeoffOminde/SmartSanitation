import axios from 'axios';

export interface InstaSendConfig {
  publicKey: string;
  secretKey: string;
  environment: 'test' | 'live';
}

export interface STKPushRequest {
  phone_number: string;
  amount: number;
  narrative: string;
  host: string;
}

export interface STKPushResponse {
  id: string;
  status: string;
  checkout_id: string;
  message?: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  amount: number;
  phone_number: string;
  checkout_id: string;
  created_at: string;
  updated_at: string;
  account: string;
  api_ref: string;
  host: string;
  failed_reason?: string;
  mpesa_reference?: string;
}

export class InstaSendClient {
  private baseUrl: string;
  private config: InstaSendConfig;

  constructor(config: InstaSendConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'test' 
      ? 'https://sandbox.intasend.com/api/v1'
      : 'https://payment.intasend.com/api/v1';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/mpesa-stk-push/`,
        {
          phone_number: request.phone_number,
          amount: request.amount,
          narrative: request.narrative,
          host: request.host,
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`InstaSend STK Push failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(checkoutId: string): Promise<PaymentStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment/status/`,
        {
          params: { checkout_id: checkoutId },
          headers: this.getHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`InstaSend status check failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Create checkout link for multiple payment methods
   */
  async createCheckoutLink(request: {
    amount: number;
    currency: string;
    narrative: string;
    host: string;
    redirect_url?: string;
  }): Promise<{ id: string; url: string; qr_code: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/`,
        request,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`InstaSend checkout creation failed: ${error.response?.data?.detail || error.message}`);
    }
  }
}

// Singleton instance
let instaSendClient: InstaSendClient | null = null;

export function getInstaSendClient(): InstaSendClient {
  if (!instaSendClient) {
    if (!process.env.INTASEND_SECRET_KEY || !process.env.INTASEND_PUBLIC_KEY) {
      throw new Error('InstaSend API keys are required. Please set INTASEND_SECRET_KEY and INTASEND_PUBLIC_KEY environment variables.');
    }

    instaSendClient = new InstaSendClient({
      publicKey: process.env.INTASEND_PUBLIC_KEY,
      secretKey: process.env.INTASEND_SECRET_KEY,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'test',
    });
  }

  return instaSendClient;
}