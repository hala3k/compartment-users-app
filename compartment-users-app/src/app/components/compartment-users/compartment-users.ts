import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DataService, UserGroup } from '../../services/data';
import { HttpClientModule } from '@angular/common/http';

interface FormItem {
  id: number;
  form: FormGroup;
  compartments: string[];
  filteredCompartments: string[];
  users: UserGroup[];
  filteredUsers: UserGroup[];
  compartmentSearchTerm: string;
  userSearchTerm: string;
  showCompartmentDropdown: boolean;
  loading: boolean;
  loadingUsers: boolean;
}

@Component({
  selector: 'app-compartment-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './compartment-users.html',
  styleUrls: ['./compartment-users.css']
})
export class CompartmentUsers implements OnInit {
  formItems: FormItem[] = [];
  private formIdCounter = 0;
  private allCompartments: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.loadCompartments();
  }

  loadCompartments(): void {
    this.dataService.getCompartments().subscribe({
      next: (compartments) => {
        this.allCompartments = compartments;
        this.addFormItem();
      },
      error: (error) => {
        console.error('Eroare la incarcarea compartimentelor:', error);
      }
    });
  }

  addFormItem(): void {
    const id = ++this.formIdCounter;
    const form = this.fb.group({
      compartment: ['', Validators.required],
      selectedUsers: [[] as UserGroup[], Validators.required]
    });

    const formItem: FormItem = {
      id,
      form,
      compartments: [...this.allCompartments],
      filteredCompartments: [...this.allCompartments],
      users: [],
      filteredUsers: [],
      compartmentSearchTerm: '',
      userSearchTerm: '',
      showCompartmentDropdown: false,
      loading: false,
      loadingUsers: false
    };

    this.formItems.push(formItem);
  }

  removeFormItem(itemId: number): void {
    this.formItems = this.formItems.filter(item => item.id !== itemId);
  }

  filterCompartments(item: FormItem): void {
    if (!item.compartmentSearchTerm.trim()) {
      item.filteredCompartments = [...item.compartments];
    } else {
      const searchTerm = item.compartmentSearchTerm.toLowerCase();
      item.filteredCompartments = item.compartments.filter(c =>
        c.toLowerCase().includes(searchTerm)
      );
    }
    item.showCompartmentDropdown = true;
  }

  onCompartmentFocus(item: FormItem): void {
    item.showCompartmentDropdown = true;
    this.filterCompartments(item);
  }

  onCompartmentBlur(item: FormItem): void {
    setTimeout(() => {
      item.showCompartmentDropdown = false;
    }, 200);
  }

  selectCompartment(item: FormItem, compartment: string): void {
    item.compartmentSearchTerm = compartment;
    item.form.patchValue({ compartment, selectedUsers: [] });
    item.showCompartmentDropdown = false;
    this.loadUsers(item, compartment);
  }

  loadUsers(item: FormItem, compartment: string): void {
    item.loadingUsers = true;
    item.users = [];
    item.filteredUsers = [];

    this.dataService.getUsersByCompartment(compartment).subscribe({
      next: (users) => {
        item.users = users;
        item.filteredUsers = users;
        item.loadingUsers = false;
      },
      error: (error) => {
        console.error('Eroare la incarcarea utilizatorilor:', error);
        item.loadingUsers = false;
      }
    });
  }

  filterUsers(item: FormItem): void {
    if (!item.userSearchTerm.trim()) {
      item.filteredUsers = [...item.users];
    } else {
      const searchTerm = item.userSearchTerm.toLowerCase();
      item.filteredUsers = item.users.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
  }

  toggleUser(item: FormItem, user: UserGroup): void {
    const selectedUsers: UserGroup[] = item.form.get('selectedUsers')?.value || [];
    const index = selectedUsers.findIndex(u => u.id === user.id);

    let updatedUsers: UserGroup[];
    if (index > -1) {
      updatedUsers = selectedUsers.filter(u => u.id !== user.id);
    } else {
      updatedUsers = [...selectedUsers, user];
    }

    item.form.patchValue({ selectedUsers: updatedUsers });
  }

  isUserSelected(item: FormItem, user: UserGroup): boolean {
    const selectedUsers: UserGroup[] = item.form.get('selectedUsers')?.value || [];
    return selectedUsers.some(u => u.id === user.id);
  }

  removeUser(item: FormItem, user: UserGroup): void {
    const selectedUsers: UserGroup[] = item.form.get('selectedUsers')?.value || [];
    const updatedUsers = selectedUsers.filter(u => u.id !== user.id);
    item.form.patchValue({ selectedUsers: updatedUsers });
  }

  getSelectedUsers(item: FormItem): UserGroup[] {
    return item.form.get('selectedUsers')?.value || [];
  }

  hasSelectedUsers(): boolean {
    return this.formItems.some(item => this.getSelectedUsers(item).length > 0);
  }

  syncAll(): void {
    const payload = {
      timestamp: new Date().toISOString(),
      forms: this.formItems
        .filter(item => item.form.get('compartment')?.value && this.getSelectedUsers(item).length > 0)
        .map(item => ({
          compartment: item.form.get('compartment')?.value,
          selectedUsers: this.getSelectedUsers(item)
        }))
    };

    console.log('Sincronizare date:', payload);
  }

  trackByFormId(index: number, item: FormItem): number {
    return item.id;
  }
}
