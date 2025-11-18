import { Component, signal } from '@angular/core';
import { CompartmentUsers } from './components/compartment-users/compartment-users';

@Component({
  selector: 'app-root',
  imports: [CompartmentUsers],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('compartment-users-app');
}
