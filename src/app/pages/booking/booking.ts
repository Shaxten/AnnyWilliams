import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService, AvailabilitySlot } from '../../services/calendar.service';
import { SeoService } from '../../services/seo.service';

type BookingStep = 'calendar' | 'form' | 'confirm';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class BookingComponent implements OnInit, OnDestroy {
  calSvc  = inject(CalendarService);
  private seoSvc = inject(SeoService);

  constructor() {
    this.seoSvc.set({
      title: 'Réservation en ligne — Prenez rendez-vous avec Anny Williams',
      description: 'Réservez votre consultation en ligne avec Anny Williams à Sorel-Tracy. Choisissez votre créneau disponible pour la stimulation du langage, la relation d\'aide ou un atelier de connaissance de soi. Réponse sous 24h.',
      keywords: 'réservation consultation Sorel-Tracy, prendre rendez-vous coach Sorel, booking en ligne développement personnel',
      canonical: '/reservation'
    });
  }

  // ── State ──────────────────────────────────────────────────
  step    = signal<BookingStep>('calendar');
  loading = signal(false);
  error   = signal('');

  // ── Calendar ───────────────────────────────────────────────
  today        = new Date();
  viewYear     = signal(this.today.getFullYear());
  viewMonth    = signal(this.today.getMonth() + 1);
  slots        = signal<AvailabilitySlot[]>([]);
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<AvailabilitySlot | null>(null);
  private realtimeSub: any;

  // ── Booking form ───────────────────────────────────────────
  bookingForm = {
    name:    '',
    email:   '',
    phone:   '',
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
  monthLabel = computed(() =>
    new Date(this.viewYear(), this.viewMonth() - 1, 1)
      .toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
  );

  calendarDays = computed(() => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const first = new Date(year, month - 1, 1);
    const last  = new Date(year, month, 0);
    const startDow = (first.getDay() + 6) % 7;
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
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.calSvc['supabase'].client.removeChannel(this.realtimeSub);
    }
  }

  // ── Calendar ───────────────────────────────────────────────
  prevMonth() {
    if (this.viewMonth() === 1) { this.viewMonth.set(12); this.viewYear.update(y => y - 1); }
    else this.viewMonth.update(m => m - 1);
    this.selectedDate.set(null); this.selectedSlot.set(null);
    this.loadSlots();
  }

  nextMonth() {
    if (this.viewMonth() === 12) { this.viewMonth.set(1); this.viewYear.update(y => y + 1); }
    else this.viewMonth.update(m => m + 1);
    this.selectedDate.set(null); this.selectedSlot.set(null);
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
      this.viewYear(), this.viewMonth(), () => this.loadSlots()
    );
  }

  selectDate(date: string | null) {
    if (!date) return;
    if (!this.slots().some(s => s.slot_date === date && !s.booked)) return;
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

  proceedToForm() {
    if (!this.selectedSlot()) return;
    this.step.set('form');
    this.error.set('');
  }

  // ── Confirm booking ────────────────────────────────────────
  async confirmBooking() {
    const slot = this.selectedSlot();
    if (!slot || !this.bookingForm.name || !this.bookingForm.email || !this.bookingForm.service) return;

    this.loading.set(true);
    this.error.set('');
    try {
      await this.calSvc.bookSlot(
        slot.id,
        this.bookingForm.service,
        this.bookingForm.name,
        this.bookingForm.email,
        this.bookingForm.phone,
        this.bookingForm.message
      );
      this.step.set('confirm');
      await this.loadSlots();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  formatTime(t: string) { return t.substring(0, 5); }

  formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  backToCalendar() {
    this.step.set('calendar');
    this.error.set('');
    this.bookingForm = { name: '', email: '', phone: '', service: '', message: '' };
  }
}
