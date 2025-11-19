import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService, UserGroup } from '../../services/data';
import { ExternalSyncService, FormStateDto } from '../../services/external-sync';
import { debounceTime, distinctUntilChanged, filter, tap, finalize, switchMap, catchError } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-compartment-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './compartment-users.html',
  styleUrl: './compartment-users.css',
})
export class CompartmentUsers implements OnInit, OnDestroy {
  form: FormGroup;
  compartments: string[] = [];
  filteredCompartments: string[] = [];
  users: UserGroup[] = [];
  filteredUsers: UserGroup[] = [];
  loading = false;
  loadingUsers = false;
  compartmentSearchTerm = '';
  userSearchTerm = '';
  showCompartmentDropdown = false;
  private syncSubscription?: Subscription;
  isSyncing = false;
  syncStatus: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private syncService: ExternalSyncService
  ) {
    this.form = this.fb.group({
      compartment: ['', Validators.required],
      selectedUsers: [[], [Validators.required, this.minLengthArray(1)]]
    });
  }

  minLengthArray(min: number) {
    return (control: any) => {
      if (control.value && control.value.length >= min) {
        return null;
      }
      return { minLengthArray: { valid: false } };
    };
  }

  ngOnInit(): void {
    this.loadCompartments();
    this.setupCompartmentListener();
    this.setupFormSync();
  }

  ngOnDestroy(): void {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  setupFormSync(): void {
    this.syncSubscription = this.form.valueChanges.pipe(
      filter(() => this.form.valid),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        this.isSyncing = true;
        this.syncStatus = 'Syncing...';
      }),
      switchMap((formValue) => {
        const formState: FormStateDto = {
          compartment: formValue.compartment,
          selectedUsers: formValue.selectedUsers,
          timestamp: new Date().toISOString()
        };
        return this.syncService.syncFormState(formState).pipe(
          finalize(() => {
            this.isSyncing = false;
          }),
          catchError((error) => {
            console.error('Sync error:', error);
            return of({ success: false, error: error.message });
          })
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response.success !== false) {
          this.syncStatus = 'Synced successfully';
          this.syncService.lastSyncStatus = 'success';
          setTimeout(() => {
            this.syncStatus = '';
          }, 2000);
        } else {
          this.syncStatus = 'Sync failed';
          this.syncService.lastSyncStatus = 'error';
          setTimeout(() => {
            this.syncStatus = '';
          }, 3000);
        }
      }
    });
  }

  loadCompartments(): void {
    this.loading = true;
    this.form.get('compartment')?.disable();
    this.dataService.getCompartments().subscribe({
      next: (data) => {
        this.compartments = data;
        this.filteredCompartments = data;
        this.loading = false;
        this.form.get('compartment')?.enable();
      },
      error: (error) => {
        console.error('Error loading compartments:', error);
        this.loading = false;
        this.form.get('compartment')?.enable();
      }
    });
  }

  setupCompartmentListener(): void {
    this.form.get('compartment')?.valueChanges.subscribe((compartment) => {
      if (compartment) {
        this.loadUsers(compartment);
        this.form.patchValue({ selectedUsers: [] });
      } else {
        this.users = [];
      }
    });
  }

  loadUsers(compartment: string): void {
    this.loadingUsers = true;
    this.userSearchTerm = '';
    this.dataService.getUsersByCompartment(compartment).subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loadingUsers = false;
      }
    });
  }

  toggleUser(user: UserGroup): void {
    const currentUsers: UserGroup[] = this.form.get('selectedUsers')?.value || [];
    const index = currentUsers.findIndex((u: UserGroup) => u.id === user.id);
    
    let updatedUsers: UserGroup[];
    if (index > -1) {
      updatedUsers = currentUsers.filter((u: UserGroup) => u.id !== user.id);
    } else {
      updatedUsers = [...currentUsers, user];
    }
    
    this.form.patchValue({ selectedUsers: updatedUsers });
  }

  isUserSelected(user: UserGroup): boolean {
    const selectedUsers: UserGroup[] = this.form.get('selectedUsers')?.value || [];
    return selectedUsers.some((u: UserGroup) => u.id === user.id);
  }

  removeUser(user: UserGroup): void {
    const currentUsers: UserGroup[] = this.form.get('selectedUsers')?.value || [];
    const updatedUsers = currentUsers.filter((u: UserGroup) => u.id !== user.id);
    this.form.patchValue({ selectedUsers: updatedUsers });
  }

  filterCompartments(): void {
    if (!this.compartmentSearchTerm.trim()) {
      this.filteredCompartments = this.compartments;
    } else {
      const searchTerm = this.compartmentSearchTerm.toLowerCase();
      this.filteredCompartments = this.compartments.filter(compartment =>
        compartment.toLowerCase().includes(searchTerm)
      );
    }
    this.showCompartmentDropdown = true;
  }

  selectCompartment(compartment: string): void {
    this.compartmentSearchTerm = compartment;
    this.form.patchValue({ compartment: compartment });
    this.showCompartmentDropdown = false;
  }

  onCompartmentFocus(): void {
    this.showCompartmentDropdown = true;
    this.filterCompartments();
  }

  onCompartmentBlur(): void {
    setTimeout(() => {
      this.showCompartmentDropdown = false;
      const exactMatch = this.compartments.find(
        c => c.toLowerCase() === this.compartmentSearchTerm.trim().toLowerCase()
      );
      if (exactMatch && this.form.get('compartment')?.value !== exactMatch) {
        this.selectCompartment(exactMatch);
      } else if (this.compartmentSearchTerm && !exactMatch) {
        this.compartmentSearchTerm = this.form.get('compartment')?.value || '';
      }
    }, 200);
  }

  onCompartmentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.filteredCompartments.length > 0) {
      event.preventDefault();
      const exactMatch = this.compartments.find(
        c => c.toLowerCase() === this.compartmentSearchTerm.trim().toLowerCase()
      );
      if (exactMatch) {
        this.selectCompartment(exactMatch);
      } else {
        this.selectCompartment(this.filteredCompartments[0]);
      }
    }
  }

  filterUsers(): void {
    if (!this.userSearchTerm.trim()) {
      this.filteredUsers = this.users;
    } else {
      const searchTerm = this.userSearchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
  }
}
