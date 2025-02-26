import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isFormSubmitted = false;
  isRightPanelActive: boolean = false;
  @ViewChild('loginMapContainer', { static: false }) loginMapContainer!: ElementRef;
  constructor( private router: Router) {}

  username: string = '';
  email: string = '';
  password: string = '';

  loginObject = {
    username: '',
    password: '',
    errorMessage: ''
  }

  togglePanel(activate: boolean): void {
    this.isRightPanelActive = activate;
  }

  entrar() {
    this.router.navigate(['/dashboard']);
  }
}