import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CalendarService, AvailabilitySlot, Booking } from '../../services/calendar.service';
import { SupabaseService } from '../../services/supabase.service';
import { SeoService } from '../../services/seo.service';

type BookingStep = 'calendar' | 'form' | 'confirm' | 'my-bookings' | 'profile';
type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class BookingComponent implements OnInit, OnDestroy {
  auth      = inject(AuthService);
  calSvc    = inject(CalendarService);
  supabase  = inject(SupabaseService);
  private seoSvc = inject(SeoService);

  constructor() {
    this.seoSvc.set({
      title: 'Réservation en ligne — Prenez rendez-vous avec Anny Williams',
      description: 'Réservez votre consultation en ligne avec Anny Williams à Sorel-Tracy. Choisissez votre créneau disponible pour la stimulation du langage, la relation d\'aide ou un atelier de connaissance de soi. Réponse sous 24h.',
      keywords: 'réservation consultation Sorel-Tracy, prendre rendez-vous coach Sorel, booking en ligne développement personnel, rendez-vous stimulation langage, consultation relation aide Québec',
      canonical: '/reservation',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'ReservationPackage',
        name: 'Réservation de consultation — Anny Williams',
        provider: { '@type': 'Person', name: 'Anny Williams', telephone: '+14508992529' }
      }
    });
  }

  // ── State ──────────────────────────────────────────────────
  step         = signal<BookingStep>('calendar');
  authMode     = signal<AuthMode>('login');
  loading      = signal(false);
  error        = signal('');
  success      = signal('');

  // ── Profile ────────────────────────────────────────────────
  profileForm  = { full_name: '', phone: '' };
  profileSaved = signal(false);

  // ── Calendar ───────────────────────────────────────────────
  today        = new Date();
  viewYear     = signal(this.today.getFullYear());
  viewMonth    = signal(this.today.getMonth() + 1); // 1-12
  slots        = signal<AvailabilitySlot[]>([]);
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<AvailabilitySlot | null>(null);
  myBookings   = signal<Booking[]>([]);
  private realtimeSub: any;

  // ── Auth form ──────────────────────────────────────────────
  authForm = { email: '', password: '', fullName: '' };

  // ── Booking form ───────────────────────────────────────────
  bookingForm = {
    service: '',
    message: ''
  };

  services = [
    'Stimulation du langage',
    'Relation d\'aide',
    'Connaissance de soi — Adolescent',
    'Connaissance de soi — Adulte',
    'Autre / À discuter'
  ];

  // ── Computed ───────────────────────────────────────────────
  monthLabel = computed(() => {
    return new Date(this.viewYear(), this.viewMonth() - 1, 1)
      .toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const first = new Date(year, month - 1, 1);
    const last  = new Date(year, month, 0);

    // Padding avant le 1er (lundi = 0)
    const startDow = (first.getDay() + 6) % 7; // 0=lundi
    const days: Array<{ date: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < startDow; i++) days.push({ date: null, dayNum: null });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ date, dayNum: d });
    }
    return days;
  });

  slotsForDate = computed(() => {
    const date = this.selectedDate();
    if (!date) return [];
    return this.slots().filter(s => s.slot_date === date);
  });

  datesWithSlots = computed(() => {
    const available = new Set<string>();
    const booked    = new Set<string>();
    this.slots().forEach(s => {
      if (s.booked) booked.add(s.slot_date);
      else available.add(s.slot_date);
    });
    return { available, booked };
  });

  // ── Lifecycle ──────────────────────────────────────────────
  async ngOnInit() {
    await this.loadSlots();
    this.subscribeRealtime();
    if (this.auth.isLoggedIn) {
      await this.loadProfile();
    }
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.calSvc['supabase'].client.removeChannel(this.realtimeSub);
    }
  }

  // ── Calendar navigation ────────────────────────────────────
  prevMonth() {
    if (this.viewMonth() === 1) {
      this.viewMonth.set(12);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  nextMonth() {
    if (this.viewMonth() === 12) {
      this.viewMonth.set(1);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  async loadSlots() {
    this.loading.set(true);
    try {
      const data = await this.calSvc.getSlotsForMonth(this.viewYear(), this.viewMonth());
      this.slots.set(data);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  subscribeRealtime() {
    this.realtimeSub = this.calSvc.subscribeToSlotChanges(
      this.viewYear(), this.viewMonth(),
      () => this.loadSlots()
    );
  }

  // ── Day / slot selection ───────────────────────────────────
  selectDate(date: string | null) {
    if (!date) return;
    const hasSlots = this.slots().some(s => s.slot_date === date && !s.booked);
    if (!hasSlots) return;
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  selectSlot(slot: AvailabilitySlot) {
    if (slot.booked) return;
    this.selectedSlot.set(slot);
  }

  getDayClass(date: string | null): string {
    if (!date) return 'cal__day--empty';
    const { available, booked } = this.datesWithSlots();
    const today = new Date().toISOString().split('T')[0];
    if (date < today) return 'cal__day--past';
    if (date === this.selectedDate()) return 'cal__day--selected';
    if (available.has(date)) return 'cal__day--available';
    if (booked.has(date) && !available.has(date)) return 'cal__day--full';
    return 'cal__day--no-slot';
  }

  // ── Auth ───────────────────────────────────────────────────
  async onAuth() {
    this.loading.set(true);
    this.error.set('');
    try {
      if (this.authMode() === 'register') {
        await this.auth.signUp(this.authForm.email, this.authForm.password, this.authForm.fullName);
        this.success.set('Compte créé ! Vérifiez votre courriel pour confirmer.');
      } else {
        await this.auth.signIn(this.authForm.email, this.authForm.password);
        await this.loadProfile();
      }
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Profile ────────────────────────────────────────────────
  async loadProfile() {
    const user = this.auth.currentUser();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    if (data) {
      this.profileForm.full_name = data.full_name ?? '';
      this.profileForm.phone     = data.phone ?? '';
    }
  }

  async saveProfile() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .upsert({
          id:        user.id,
          full_name: this.profileForm.full_name,
          phone:     this.profileForm.phone
        });
      if (error) throw error;
      this.profileSaved.set(true);
      setTimeout(() => this.profileSaved.set(false), 3000);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Booking ────────────────────────────────────────────────
  proceedToForm() {
    if (!this.selectedSlot()) return;
    if (!this.auth.isLoggedIn) return;
    this.step.set('form');
    this.error.set('');
  }

  async confirmBooking() {
    const slot = this.selectedSlot();
    if (!slot || !this.bookingForm.service) return;

    this.loading.set(true);
    this.error.set('');
    try {
      await this.calSvc.bookSlot(slot.id, this.bookingForm.service, this.bookingForm.message);
      this.step.set('confirm');
      await this.loadSlots();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ── My bookings ────────────────────────────────────────────
  async showMyBookings() {
    this.loading.set(true);
    try {
      const data = await this.calSvc.getMyBookings();
      this.myBookings.set(data);
      this.step.set('my-bookings');
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async cancelBooking(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    try {
      await this.calSvc.cancelBooking(id);
      await this.showMyBookings();
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  formatTime(t: string) {
    return t.substring(0, 5);
  }

  formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  statusLabel(s: string) {
    return { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' }[s] ?? s;
  }

  backToCalendar() {
    this.step.set('calendar');
    this.error.set('');
    this.success.set('');
  }
}
