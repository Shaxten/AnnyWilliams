import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AdminBooking {
  id: number;
  user_id: string;
  slot_id: number;
  service_name: string;
  message: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  availability_slots: {
    slot_date: string;
    start_time: string;
    end_time: string;
  };
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
  // email from auth — joined via user_id
  user_email?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabase = inject(SupabaseService);

  async isAdmin(): Promise<boolean> {
    const { data } = await this.supabase.client.auth.getSession();
    const meta = data.session?.user?.app_metadata;
    return meta?.['role'] === 'admin';
  }

  async getAllBookings(status?: string): Promise<AdminBooking[]> {
    let query = this.supabase.client
      .from('bookings')
      .select(`
        *,
        availability_slots (slot_date, start_time, end_time),
        profiles (full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async updateBookingStatus(id: number, status: 'confirmed' | 'cancelled'): Promise<void> {
    const { error } = await this.supabase.client
      .from('bookings')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  async getStats() {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('status');
    if (error) throw error;

    const stats = { pending: 0, confirmed: 0, cancelled: 0, total: 0 };
    (data ?? []).forEach(b => {
      stats[b.status as keyof typeof stats]++;
      stats.total++;
    });
    return stats;
  }

  async addSlot(date: string, startTime: string, endTime: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('availability_slots')
      .insert([{ slot_date: date, start_time: startTime, end_time: endTime, is_available: true }]);
    if (error) throw error;
  }

  async deleteSlot(id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('availability_slots')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getSlotsForDate(date: string) {
    const { data, error } = await this.supabase.client
      .from('availability_slots')
      .select('*')
      .eq('slot_date', date)
      .order('start_time');
    if (error) throw error;
    return data ?? [];
  }
}
