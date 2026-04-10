import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  { 
    path: 'admin', 
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'pricing',
        loadComponent: () => import('./features/admin/pricing/pricing').then(m => m.Pricing)
      },
      {
        path: 'invoice',
        loadComponent: () => import('./shared/components/invoice-form/invoice-form').then(m => m.InvoiceForm),
        data: { allowRateEdit: true, backRoute: '/admin/dashboard' }
      },
      {
        path: 'order',
        loadComponent: () => import('./shared/components/order-form/order-form').then(m => m.OrderForm),
        data: { allowRateEdit: true, backRoute: '/admin/dashboard' }
      }
      // Future Admin features: reports, users, inventory master etc.
    ]
  },
  { 
    path: 'biller', 
    canActivate: [AuthGuard],
    data: { roles: ['Biller'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/biller/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'invoice',
        loadComponent: () => import('./shared/components/invoice-form/invoice-form').then(m => m.InvoiceForm),
        data: { allowRateEdit: false, backRoute: '/biller/dashboard' }
      },
      {
        path: 'order',
        loadComponent: () => import('./shared/components/order-form/order-form').then(m => m.OrderForm),
        data: { allowRateEdit: false, backRoute: '/biller/dashboard' }
      }
      // Future Biller features: billing, ordering new items
    ]
  },
  { path: '**', redirectTo: 'login' }
];
