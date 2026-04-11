import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class UserProfile implements OnInit {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  successMessage: string | null = null;
  dashboardRoute = '/';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.dashboardRoute =
      this.currentUser.role === 'Admin' ? '/admin/dashboard' : '/biller/dashboard';

    this.profileForm = this.fb.group({
      displayName: [
        this.currentUser.displayName ?? this.currentUser.username,
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
    });
  }

  get initials(): string {
    if (!this.currentUser) return '';
    const name = this.currentUser.displayName ?? this.currentUser.username;
    return name.length >= 2 ? name.slice(0, 2).toUpperCase() : name.toUpperCase();
  }

  onSave(): void {
    if (this.profileForm.valid) {
      this.authService.updateDisplayName(this.profileForm.value.displayName);
      this.currentUser = this.authService.getCurrentUser();
      this.successMessage = 'Profile updated successfully.';
      this.profileForm.markAsPristine();
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }
  }
}
