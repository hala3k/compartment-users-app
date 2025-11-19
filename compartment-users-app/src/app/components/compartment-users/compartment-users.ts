import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService, User } from '../../services/data';

@Component({
  selector: 'app-compartment-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './compartment-users.html',
  styleUrl: './compartment-users.css',
})
export class CompartmentUsers implements OnInit {
  form: FormGroup;
  compartments: string[] = [];
  filteredCompartments: string[] = [];
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  loadingUsers = false;
  compartmentSearchTerm = '';
  userSearchTerm = '';
  showCompartmentDropdown = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
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

  toggleUser(user: User): void {
    const currentUsers: User[] = this.form.get('selectedUsers')?.value || [];
    const index = currentUsers.findIndex((u: User) => u.id === user.id);
    
    let updatedUsers: User[];
    if (index > -1) {
      updatedUsers = currentUsers.filter((u: User) => u.id !== user.id);
    } else {
      updatedUsers = [...currentUsers, user];
    }
    
    this.form.patchValue({ selectedUsers: updatedUsers });
  }

  isUserSelected(user: User): boolean {
    const selectedUsers: User[] = this.form.get('selectedUsers')?.value || [];
    return selectedUsers.some((u: User) => u.id === user.id);
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
