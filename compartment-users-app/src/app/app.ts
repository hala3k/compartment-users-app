import { Component, signal } from '@angular/core';
import { CompartmentUsers } from './components/compartment-users/compartment-users';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CompartmentUsers],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Gestionare Utilizatori Compartimente');
}
