import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface BookingEmailData {
  guest_name:   string;
  guest_email:  string;
  guest_phone?: string;
  service_name: string;
  message?:     string;
  slot_date:    string;
  start_time:   string;
  end_time:     string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private supabase = inject(SupabaseService);

  async sendBookingEmail(type: 'new_booking' | 'confirmed', booking: BookingEmailData): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('send-booking-email', {
      body: { type, booking }
    });
    if (error) {
      console.warn('Email non envoyé:', error.message);
      // Ne pas bloquer la réservation si l'email échoue
    }
  }
}
