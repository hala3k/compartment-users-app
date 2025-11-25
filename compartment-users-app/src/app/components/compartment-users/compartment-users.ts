
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { UserGroup } from '@asigno-workspace/shared/domain';
import { TranslateService } from '@ngx-translate/core'; ``
import { FormControlStringComponent } from 'libs/asigno-schema-form-widgets/forms-ddcm/components/form-controls/form-controls-string/form-controls-string.component';
import { UserGroupControllerService, OrganisationControllerService } from '@asigno-workspace/shared/domain'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectWidget } from 'ngx-schema-form';
import { UserSignalStore } from '@asigno-workspace/shared/store';
import { or } from 'ajv/dist/compile/codegen';
import { Subscription } from 'rxjs';
import { UserService } from '@asigno-workspace/shared/services';
import { GnmUserGroupService } from '@asigno-forms/services/gnm-user-groups.service';


@Component({
  selector: 'app-form-controls-rar-signature',
  templateUrl: './form-controls-gnm-data-assignment.component.html',
  styleUrls: ['./form-controls-gnm-data-assignment.component.scss']
})
export class FormControlsGnmDataAssignmentComponent extends SelectWidget implements OnInit {

  form!: FormGroup;
  compartments: string[] = [];
  filteredCompartments: string[] = [];
  users: UserGroup[] = [];
  filteredUsers: UserGroup[] = [];
  loading = false;
  loadingUsers = false;
  selectedCompartment: string = '';
  compartmentSearchTerm = '';
  userSearchTerm = '';
  parentGroupPath = "partygnm";
  showCompartmentDropdown = false;
  subscriptions: Subscription[] = [];
  isReadOnly = false;


  private readonly userStore = inject(UserSignalStore);


  constructor(private translateService: TranslateService,
    private fb: FormBuilder,
    private userGroupControllerService: UserGroupControllerService,
    private organisationControllerService: OrganisationControllerService,
    private userService: UserService,
    private gnmUserGroupService: GnmUserGroupService,
  ) {
    super();

    this.subscriptions.push(this.organisationControllerService.getMyOrganisationUsingGET().subscribe(organization => {

      if (organization.name === undefined || organization.name === '') {
        this.userService.getCurrentTenants().then(result => {
          this.parentGroupPath = result.currentSubTenant.value.substring(0, result.currentSubTenant.value.lastIndexOf('/'));
        });
      }
      else {
        this.parentGroupPath = organization.owner?.id.substring(0, organization.owner.id.lastIndexOf('/'));
      }
      this.loadCompartments();
    }));



    this.form = this.fb.group({
      compartment: ['', Validators.required],
      selectedUsers: [[], [Validators.required, this.minLengthArray(1)]]
    });
  }


  ngOnInit(): void {


    const currentSubTenant = this.userStore.currentSubTenant()
    const currentTenant = this.userStore.currentTenant()
    const fullSubtenatPath = currentTenant + "/" + currentSubTenant

    this.isReadOnly = this.formProperty.value.superiorGroup && !currentSubTenant.includes("COMISARIAT_GENERAL") && (this.formProperty.value.superiorGroup.includes(fullSubtenatPath) || this.formProperty.value.compartment == fullSubtenatPath)

    if(!this.isReadOnly)
      this.setupCompartmentListener();
  }

  minLengthArray(min: number) {
    return (control: any) => {
      if (control.value && control.value.length >= min) {
        return null;
      }
      return { minLengthArray: { valid: false } };
    };
  }


  loadCompartments(): void {
    this.loading = true;
    this.form.get('compartment')?.disable();
    // add IT_SERVICIU like comisar general
    this.parentGroupPath =  true || this.parentGroupPath.includes("COMISARIAT_GENERAL") ? "partygnm" : this.parentGroupPath
    this.gnmUserGroupService.getGroups(this.parentGroupPath).then(groups => {
      this.compartments = groups;
      this.filteredCompartments = groups;
      this.loading = false;
      this.form.get('compartment')?.enable();
      this.form.controls.compartment.setValue(this.formProperty.value.compartment)

      this.compartmentSearchTerm = this.translateLastGroup(this.formProperty.value.compartment)
    });
  }

  setupCompartmentListener(): void {
    this.form.get('compartment')?.valueChanges.subscribe((compartment) => {
      if (compartment) {
        this.selectedCompartment = compartment;
        this.loadUsers(compartment);
        this.form.patchValue({ selectedUsers: [] });
      } else {
        this.users = [];
      }
    });
  }

  loadUsers(compartment: string): void {
    this.loadingUsers = true;
    this.userGroupControllerService.getUserGroupsUsingGET(undefined, 1000, undefined, undefined, null, null, "INTOCMITOR", "USER", compartment, false, undefined, 1000).subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data
        this.loadingUsers = false;
        if (this.users.length === 1) {
          this.form.patchValue({ selectedUsers: this.users });
          this.formProperty.setValue(this.form.value, false);
        }
        if (compartment === this.formProperty.value.compartment) {
          this.form.controls.selectedUsers.setValue(this.formProperty.value.selectedUsers)
        }
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
    this.formProperty.setValue(this.form.value, false);
  }

  getLastGroup(path: string): string {
    return path?.substring(path.lastIndexOf('/') + 1);
  }
  translateLastGroup(path: string): string {

    const last = this.getLastGroup(path)
    const translated = this.translateService.instant('setTenantComponent.subTenants.' + last)

    if (translated && !translated.includes('setTenantComponent')) {
      return translated
    } else {
      return path
    }

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
      this.filteredCompartments = this.compartments.filter(compartment => {
        const last = this.getLastGroup(compartment);
        const translated = this.translateService.instant(
          'setTenantComponent.subTenants.' + last
        ).toLowerCase();

        if (translated && !translated.includes('setTenantComponent')) {
          return translated.includes(searchTerm);
        } else {
          return compartment.includes(searchTerm);
        }


      });
    }
    this.showCompartmentDropdown = true;
  }

  selectCompartment(compartment: string): void {
    this.compartmentSearchTerm = this.translateLastGroup(compartment);
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
        let compartment = this.form.get('compartment')?.value || '';
        this.compartmentSearchTerm = this.translateLastGroup(compartment);
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
        user.id.toLowerCase().includes(searchTerm)
      );
    }
  }
}
