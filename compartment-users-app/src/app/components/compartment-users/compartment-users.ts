import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService, User } from '../../services/data';

@Component({
  selector: 'app-compartment-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compartment-users.html',
  styleUrl: './compartment-users.css',
})
export class CompartmentUsers implements OnInit {
  form: FormGroup;
  compartments: string[] = [];
  users: User[] = [];
  loading = false;
  loadingUsers = false;

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
    this.dataService.getUsersByCompartment(compartment).subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loadingUsers = false;
      }
    });
  }

  toggleUser(userId: number): void {
    const currentUsers = this.form.get('selectedUsers')?.value || [];
    const index = currentUsers.indexOf(userId);
    
    let updatedUsers: number[];
    if (index > -1) {
      updatedUsers = currentUsers.filter((id: number) => id !== userId);
    } else {
      updatedUsers = [...currentUsers, userId];
    }
    
    this.form.patchValue({ selectedUsers: updatedUsers });
  }

  isUserSelected(userId: number): boolean {
    const selectedUsers = this.form.get('selectedUsers')?.value || [];
    return selectedUsers.includes(userId);
  }

  onSubmit(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
    
    if (this.form.valid) {
      const formValue = this.form.value;
      const selectedUserObjects = this.users.filter(user => 
        formValue.selectedUsers.includes(user.id)
      );
      
      console.log('Form submitted:', {
        compartment: formValue.compartment,
        selectedUsers: selectedUserObjects
      });
      
      alert(`Selected compartment: ${formValue.compartment}\nSelected users: ${selectedUserObjects.map(u => u.name).join(', ')}`);
    }
  }
}
