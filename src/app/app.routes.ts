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
      { path: 'order/new', loadComponent: () => import('./shared/components/new-order/new-order').then(m => m.NewOrder), data: { allowRateEdit: true, backRoute: '/admin/dashboard' } },
      { path: 'order/summary', loadComponent: () => import('./shared/components/order-summary/order-summary').then(m => m.OrderSummary), data: { backRoute: '/admin/dashboard' } },
      { path: 'order/karigar', loadComponent: () => import('./shared/components/order-by-karigar/order-by-karigar').then(m => m.OrderByKarigar), data: { backRoute: '/admin/dashboard' } },
      { path: 'profile', loadComponent: () => import('./shared/components/profile/profile').then(m => m.UserProfile) }
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
      { path: 'order/new', loadComponent: () => import('./shared/components/new-order/new-order').then(m => m.NewOrder), data: { allowRateEdit: false, backRoute: '/biller/dashboard' } },
      { path: 'order/summary', loadComponent: () => import('./shared/components/order-summary/order-summary').then(m => m.OrderSummary), data: { backRoute: '/biller/dashboard' } },
      { path: 'order/karigar', loadComponent: () => import('./shared/components/order-by-karigar/order-by-karigar').then(m => m.OrderByKarigar), data: { backRoute: '/biller/dashboard' } },
      { path: 'profile', loadComponent: () => import('./shared/components/profile/profile').then(m => m.UserProfile) }
      // Future Biller features: billing, ordering new items
    ]
  },
  { path: '**', redirectTo: 'login' }
];
