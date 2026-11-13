import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './angular/app.component';
import './index.css';

bootstrapApplication(AppComponent).catch((error) => {
  console.error('Bloodmoon Angular bootstrap failed:', error);
});
