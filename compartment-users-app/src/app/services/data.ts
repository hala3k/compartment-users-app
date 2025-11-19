import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserGroup {
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

  getUsersByCompartment(compartment: string): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(`${this.apiUrl}/users?compartment=${compartment}`);
  }
}
