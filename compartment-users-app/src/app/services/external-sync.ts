import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export interface FormStateDto {
  compartment: string;
  selectedUsers: Array<{
    id: string;
    name: string;
    email: string;
    isGroup: boolean;
    organisationName: string;
    organisationId: string;
  }>;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExternalSyncService {
  private apiUrl = '/api/sync';
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
  lastError: string | null = null;

  constructor(private http: HttpClient) {}

  syncFormState(formState: FormStateDto): Observable<any> {
    this.lastSyncStatus = 'syncing';
    this.lastError = null;

    return this.http.post(this.apiUrl, formState).pipe(
      retry({ count: 1, delay: 1000 }),
      catchError((error: HttpErrorResponse) => {
        this.lastSyncStatus = 'error';
        this.lastError = this.getErrorMessage(error);
        console.error('Error syncing form state:', error);
        return throwError(() => error);
      })
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Client error: ${error.error.message}`;
    } else {
      return `Server error: ${error.status} - ${error.message}`;
    }
  }

  resetStatus(): void {
    this.lastSyncStatus = 'idle';
    this.lastError = null;
  }
}
