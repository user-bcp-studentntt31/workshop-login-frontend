import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmbraceSkillExampleService {
  constructor(private http: HttpClient) {}

  async loadCustomer(customerId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.get(`/api/v1/customers/${customerId}`)
    );
  }

  async createInvoice(payload: { customerId: string; amount: number }): Promise<unknown> {
    return firstValueFrom(
      this.http.post('/api/v1/invoices', payload)
    );
  }
}
