import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmbraceSkillExampleAdminService {
  constructor(private http: HttpClient) {}

  async updateCustomer(
    customerId: string,
    payload: { name: string; email: string }
  ): Promise<unknown> {
    return firstValueFrom(
      this.http.put(`/api/v1/customers/${customerId}`, payload)
    );
  }

  async patchCustomerStatus(customerId: string, status: 'active' | 'blocked'): Promise<unknown> {
    return firstValueFrom(
      this.http.patch(`/api/v1/customers/${customerId}/status`, { status })
    );
  }

  async deleteInvoice(invoiceId: string): Promise<unknown> {
    return firstValueFrom(
      this.http.delete(`/api/v1/invoices/${invoiceId}`)
    );
  }
}
