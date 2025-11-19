import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  isGroup: boolean;
  organisationName: string;
  organisationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getCompartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/compartments`);
  }

  getUsersByCompartment(compartment: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users?compartment=${compartment}`);
  }
}
