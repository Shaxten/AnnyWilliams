import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class BookingComponent {
  form = {
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    preferred_date: ''
  };

  services = [
    'Stimulation du langage',
    'Relation d\'aide',
    'Connaissance de soi — Adolescent',
    'Connaissance de soi — Adulte',
    'Autre / À discuter'
  ];

  loading = signal(false);
  success = signal(false);
  error   = signal('');

  constructor(private supabase: SupabaseService) {}

  async onSubmit() {
    if (!this.form.name || !this.form.email || !this.form.service) return;

    this.loading.set(true);
    this.error.set('');

    try {
      await this.supabase.client
        .from('bookings')
        .insert([{
          name:           this.form.name,
          email:          this.form.email,
          phone:          this.form.phone || null,
          service_name:   this.form.service,
          message:        this.form.message || null,
          preferred_date: this.form.preferred_date || null,
          status:         'pending'
        }]);

      this.success.set(true);
      this.form = { name: '', email: '', phone: '', service: '', message: '', preferred_date: '' };
    } catch (err: any) {
      this.error.set('Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
