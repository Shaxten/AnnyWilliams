import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Services / tarifs
  async getServices() {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .order('order_index');
    if (error) throw error;
    return data;
  }

  // Réservations
  async createBooking(booking: {
    name: string;
    email: string;
    phone?: string;
    service_id: number;
    message?: string;
    preferred_date?: string;
  }) {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Témoignages
  async getTestimonials() {
    const { data, error } = await this.supabase
      .from('testimonials')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
