import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMsg: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // If already logged in, redirect based on role
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.redirectByRole(currentUser.role);
    }

    this.loginForm = this.fb.group({
      username: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username } = this.loginForm.value;
      const success = this.authService.login(username);
      
      if (success) {
        const currentUser = this.authService.getCurrentUser();
        this.errorMsg = null;
        if (currentUser) {
          this.redirectByRole(currentUser.role);
        }
      } else {
        this.errorMsg = 'Invalid username. Try "admin" or "biller".';
      }
    }
  }

  private redirectByRole(role: string): void {
    if (role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'Biller') {
      this.router.navigate(['/biller/dashboard']);
    }
  }
}
