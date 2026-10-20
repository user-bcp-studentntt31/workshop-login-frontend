import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmbraceSkillExampleBillingService {
  constructor(private http: HttpClient) {}

  async listInvoices(): Promise<unknown> {
    return firstValueFrom(
      this.http.get('/api/v1/invoices')
    );
  }

  async createPayment(payload: { invoiceId: string; amount: number }): Promise<unknown> {
    return firstValueFrom(
      this.http.post('/api/v1/payments', payload)
    );
  }

  async deletePayment(paymentId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.delete(`/api/v1/payments/${paymentId}`)
    );
  }
}
