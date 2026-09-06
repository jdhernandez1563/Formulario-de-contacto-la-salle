import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactRequest {
  nombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
}

interface ContactResponse {
  success: true;
  message: string;
  contactId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);

  send(contact: ContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>('/api/contactos', contact);
  }
}
