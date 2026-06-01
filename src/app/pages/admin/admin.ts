import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminBooking } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

type AdminTab = 'bookings' | 'slots';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  private adminSvc = inject(AdminService);
  auth             = inject(AuthService);

  tab        = signal<AdminTab>('bookings');
  loading    = signal(false);
  error      = signal('');
  success    = signal('');

  // Bookings
  bookings   = signal<AdminBooking[]>([]);
  filter     = signal('all');
  stats      = signal({ pending: 0, confirmed: 0, cancelled: 0, total: 0 });

  // Slots
  slotDate   = '';
  slotTimes  = [
    '08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00'
  ];
  selectedTimes: string[] = [];
  slotsForDate = signal<any[]>([]);

  async ngOnInit() {
    await this.loadBookings();
    await this.loadStats();
  }

  async loadBookings() {
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.adminSvc.getAllBookings(this.filter());
      this.bookings.set(data);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const s = await this.adminSvc.getStats();
      this.stats.set(s);
    } catch {}
  }

  async setFilter(f: string) {
    this.filter.set(f);
    await this.loadBookings();
  }

  async confirm(id: number) {
    await this.updateStatus(id, 'confirmed');
  }

  async cancel(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    await this.updateStatus(id, 'cancelled');
  }

  private async updateStatus(id: number, status: 'confirmed' | 'cancelled') {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.adminSvc.updateBookingStatus(id, status);
      this.success.set(`Rendez-vous ${status === 'confirmed' ? 'confirmé' : 'annulé'}.`);
      setTimeout(() => this.success.set(''), 3000);
      await this.loadBookings();
      await this.loadStats();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Slots management ──────────────────────────────────────
  async loadSlotsForDate() {
    if (!this.slotDate) return;
    const data = await this.adminSvc.getSlotsForDate(this.slotDate);
    this.slotsForDate.set(data);
  }

  toggleTime(t: string) {
    const idx = this.selectedTimes.indexOf(t);
    if (idx >= 0) this.selectedTimes.splice(idx, 1);
    else this.selectedTimes.push(t);
  }

  isTimeSelected(t: string) {
    return this.selectedTimes.includes(t);
  }

  async addSlots() {
    if (!this.slotDate || !this.selectedTimes.length) return;
    this.loading.set(true);
    this.error.set('');
    try {
      for (const t of this.selectedTimes) {
        const [h, m] = t.split(':').map(Number);
        const endH = String(h + 1).padStart(2, '0');
        await this.adminSvc.addSlot(this.slotDate, t + ':00', endH + ':' + String(m).padStart(2, '0') + ':00');
      }
      this.success.set(`${this.selectedTimes.length} créneau(x) ajouté(s).`);
      setTimeout(() => this.success.set(''), 3000);
      this.selectedTimes = [];
      await this.loadSlotsForDate();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteSlot(id: number) {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await this.adminSvc.deleteSlot(id);
      await this.loadSlotsForDate();
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  formatTime(t: string) { return t.substring(0, 5); }

  statusLabel(s: string) {
    return { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' }[s] ?? s;
  }
}
