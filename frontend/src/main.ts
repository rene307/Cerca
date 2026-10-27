import 'zone.js'; // Angular 19 necesita Zone.js antes de iniciar la aplicación.
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent).catch(e=>console.error(e));
