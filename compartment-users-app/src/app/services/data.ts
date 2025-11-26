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

export interface FormItemData {
  compartment: string;
  selectedUsers: UserGroup[];
}

export interface InitialData {
  forms: FormItemData[];
}

export interface SyncPayload {
  timestamp: string;
  forms: FormItemData[];
  isValid: boolean;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  receivedAt: string;
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
    return this.http.get<UserGroup[]>(`${this.apiUrl}/users?compartment=${encodeURIComponent(compartment)}`);
  }

  getInitialData(): Observable<InitialData> {
    return this.http.get<InitialData>(`${this.apiUrl}/initial-data`);
  }

  syncFormState(payload: SyncPayload): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(`${this.apiUrl}/sync`, payload);
  }
}
