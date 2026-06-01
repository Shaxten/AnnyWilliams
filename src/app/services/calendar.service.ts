import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AvailabilitySlot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  service_type: string | null;
  is_available: boolean;
  booked?: boolean;  // calculé côté client
}

export interface Booking {
  id: number;
  user_id: string;
  slot_id: number;
  service_name: string;
  message: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  availability_slots?: AvailabilitySlot;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private supabase = inject(SupabaseService);

  // Récupère tous les slots d'un mois donné avec leur statut de réservation
  async getSlotsForMonth(year: number, month: number): Promise<AvailabilitySlot[]> {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay  = new Date(year, month, 0).toISOString().split('T')[0];

    // Récupère les slots disponibles
    const { data: slots, error: slotsErr } = await this.supabase.client
      .from('availability_slots')
      .select('*')
      .gte('slot_date', firstDay)
      .lte('slot_date', lastDay)
      .eq('is_available', true)
      .order('slot_date')
      .order('start_time');

    if (slotsErr) throw slotsErr;
    if (!slots?.length) return [];

    // Récupère les bookings existants pour ces slots
    const slotIds = slots.map(s => s.id);
    const { data: bookings, error: bookErr } = await this.supabase.client
      .from('bookings')
      .select('slot_id')
      .in('slot_id', slotIds)
      .neq('status', 'cancelled');

    if (bookErr) throw bookErr;

    const bookedSlotIds = new Set((bookings ?? []).map(b => b.slot_id));

    return slots.map(s => ({
      ...s,
      booked: bookedSlotIds.has(s.id)
    }));
  }

  // Réserve un slot — utilise une transaction pour éviter les doubles réservations
  async bookSlot(slotId: number, serviceName: string, message?: string): Promise<Booking> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .insert([{
        slot_id:      slotId,
        service_name: serviceName,
        message:      message ?? null,
        status:       'pending'
      }])
      .select(`
        *,
        availability_slots (*)
      `)
      .single();

    if (error) {
      // Code 23505 = violation de contrainte unique → slot déjà pris
      if (error.code === '23505') {
        throw new Error('Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Veuillez en choisir un autre.');
      }
      throw error;
    }

    return data;
  }

  // Récupère les réservations de l'utilisateur connecté
  async getMyBookings(): Promise<Booking[]> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select(`
        *,
        availability_slots (slot_date, start_time, end_time)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // Annule une réservation
  async cancelBooking(bookingId: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;
  }

  // Écoute les changements en temps réel sur les bookings d'un mois
  subscribeToSlotChanges(year: number, month: number, callback: () => void) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay  = new Date(year, month, 0).toISOString().split('T')[0];

    return this.supabase.client
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, callback)
      .subscribe();
  }
}
