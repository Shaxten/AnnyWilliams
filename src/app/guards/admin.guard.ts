import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = async () => {
  const admin  = inject(AdminService);
  const router = inject(Router);

  const ok = await admin.isAdmin();
  if (!ok) {
    router.navigate(['/']);
    return false;
  }
  return true;
};
