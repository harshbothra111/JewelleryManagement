import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  role: 'Admin' | 'Biller';
  displayName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Mock database of users
  private users: User[] = [
    { id: 1, username: 'admin', role: 'Admin' },
    { id: 2, username: 'biller', role: 'Biller' }
  ];

  constructor() { }

  login(username: string): boolean {
    const user = this.users.find(u => u.username === username.toLowerCase());
    if (user) {
      this.currentUserSubject.next(user);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(expectedRole: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === expectedRole : false;
  }

  updateDisplayName(displayName: string): void {
    const user = this.getCurrentUser();
    if (user) {
      const updated: User = { ...user, displayName };
      this.currentUserSubject.next(updated);
    }
  }
}
