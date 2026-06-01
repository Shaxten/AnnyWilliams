import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(m => m.ServicesComponent)
  },
  {
    path: 'a-propos',
    loadComponent: () => import('./pages/about/about').then(m => m.AboutComponent)
  },
  {
    path: 'reservation',
    loadComponent: () => import('./pages/booking/booking').then(m => m.BookingComponent)
  },
  {
    path: 'tarifs',
    loadComponent: () => import('./pages/pricing/pricing').then(m => m.PricingComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
