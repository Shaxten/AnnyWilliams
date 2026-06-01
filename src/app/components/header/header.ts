import { Component, HostListener, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  auth     = inject(AuthService);
  scrolled = signal(false);
  menuOpen = signal(false);
  userMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 60);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.header__user')) {
      this.userMenuOpen.set(false);
    }
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu() {
    this.userMenuOpen.update(v => !v);
  }

  signOut() {
    this.auth.signOut();
    this.closeMenu();
  }
}
