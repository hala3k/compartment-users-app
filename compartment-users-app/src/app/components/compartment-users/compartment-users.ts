import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService, UserGroup, FormItemData } from '../../services/data';
import { HttpClientModule } from '@angular/common/http';
import { Subject, Subscription, debounceTime, forkJoin } from 'rxjs';

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
export class CompartmentUsers implements OnInit, OnDestroy {
  formItems: FormItem[] = [];
  private formIdCounter = 0;
  private allCompartments: string[] = [];
  private changeSubject = new Subject<void>();
  private subscriptions: Subscription[] = [];
  
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
  syncMessage = '';
  isFormValid = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.setupAutoSync();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.changeSubject.complete();
  }

  private setupAutoSync(): void {
    const syncSub = this.changeSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.syncToApi();
    });
    this.subscriptions.push(syncSub);
  }

  private loadInitialData(): void {
    this.dataService.getCompartments().subscribe({
      next: (compartments) => {
        this.allCompartments = compartments;
        
        this.dataService.getInitialData().subscribe({
          next: (initialData) => {
            if (initialData.forms && initialData.forms.length > 0) {
              this.patchInitialValues(initialData.forms);
            } else {
              this.addFormItem();
            }
          },
          error: () => {
            this.addFormItem();
          }
        });
      },
      error: (error) => {
        console.error('Eroare la incarcarea compartimentelor:', error);
      }
    });
  }

  private patchInitialValues(forms: FormItemData[]): void {
    const userRequests = forms.map(formData => 
      this.dataService.getUsersByCompartment(formData.compartment)
    );

    forkJoin(userRequests).subscribe({
      next: (usersArrays) => {
        forms.forEach((formData, index) => {
          const id = ++this.formIdCounter;
          const form = this.fb.group({
            compartment: [formData.compartment, Validators.required],
            selectedUsers: [formData.selectedUsers || [], [Validators.required, this.minLengthArray(1)]]
          });

          const formItem: FormItem = {
            id,
            form,
            compartments: [...this.allCompartments],
            filteredCompartments: [...this.allCompartments],
            users: usersArrays[index] || [],
            filteredUsers: usersArrays[index] || [],
            compartmentSearchTerm: formData.compartment,
            userSearchTerm: '',
            showCompartmentDropdown: false,
            loading: false,
            loadingUsers: false
          };

          this.formItems.push(formItem);
          this.setupFormChangeListener(formItem);
        });
        this.validateAllForms();
      },
      error: () => {
        this.addFormItem();
      }
    });
  }

  private minLengthArray(min: number) {
    return (control: any) => {
      if (control.value && control.value.length >= min) {
        return null;
      }
      return { minLengthArray: true };
    };
  }

  private setupFormChangeListener(item: FormItem): void {
    const sub = item.form.valueChanges.subscribe(() => {
      this.validateAllForms();
      this.changeSubject.next();
    });
    this.subscriptions.push(sub);
  }

  private validateAllForms(): void {
    this.isFormValid = this.formItems.length > 0 && this.formItems.every(item => {
      const compartment = item.form.get('compartment')?.value;
      const selectedUsers = item.form.get('selectedUsers')?.value || [];
      return compartment && selectedUsers.length > 0;
    });
  }

  private syncToApi(): void {
    this.syncStatus = 'syncing';
    this.syncMessage = 'Se sincronizeaza...';

    const payload = {
      timestamp: new Date().toISOString(),
      forms: this.formItems.map(item => ({
        compartment: item.form.get('compartment')?.value || '',
        selectedUsers: this.getSelectedUsers(item)
      })),
      isValid: this.isFormValid
    };

    this.dataService.syncFormState(payload).subscribe({
      next: (response) => {
        this.syncStatus = 'success';
        this.syncMessage = 'Sincronizat cu succes';
        setTimeout(() => {
          if (this.syncStatus === 'success') {
            this.syncStatus = 'idle';
          }
        }, 2000);
      },
      error: (error) => {
        this.syncStatus = 'error';
        this.syncMessage = 'Eroare la sincronizare';
        console.error('Eroare sync:', error);
      }
    });
  }

  addFormItem(): void {
    const id = ++this.formIdCounter;
    const form = this.fb.group({
      compartment: ['', Validators.required],
      selectedUsers: [[] as UserGroup[], [Validators.required, this.minLengthArray(1)]]
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
    this.setupFormChangeListener(formItem);
    this.validateAllForms();
    this.changeSubject.next();
  }

  removeFormItem(itemId: number): void {
    this.formItems = this.formItems.filter(item => item.id !== itemId);
    this.validateAllForms();
    this.changeSubject.next();
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

  isItemValid(item: FormItem): boolean {
    const compartment = item.form.get('compartment')?.value;
    const selectedUsers = this.getSelectedUsers(item);
    return compartment && selectedUsers.length > 0;
  }

  trackByFormId(index: number, item: FormItem): number {
    return item.id;
  }
}
