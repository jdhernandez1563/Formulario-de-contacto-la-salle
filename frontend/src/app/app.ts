import { Component } from '@angular/core';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { IdentityPanel } from './components/identity-panel/identity-panel';
import { ContactForm } from './components/contact-form/contact-form';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, IdentityPanel, ContactForm],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
