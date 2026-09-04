import { getSupabase } from './supabaseClient';
import { Donation, PrayerRequest, ServiceBooking, Sermon, Devotional } from '../types';

export class SupabaseSyncService {
  /**
   * Syncs a new donation record into Supabase PostgreSQL
   */
  static async syncDonation(donation: Donation): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await supabase.from('donations').insert({
        donor_name: donation.donor_name,
        amount: donation.amount,
        currency: donation.currency,
        fund_type: donation.fund_type,
        payment_method: donation.payment_method,
        status: donation.status || 'completed',
        receipt_number: donation.receipt_number,
        impact_tag: donation.impact_tag || null,
        is_anonymous: donation.is_anonymous || false
      });

      if (error) {
        console.warn('Supabase donation sync notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase sync error (offline fallback active):', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Syncs a prayer request into Supabase PostgreSQL
   */
  static async syncPrayerRequest(prayer: PrayerRequest): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await supabase.from('prayer_requests').insert({
        author_name: prayer.is_anonymous ? 'Anonymous Believer' : prayer.user_name,
        title: prayer.category,
        request_text: prayer.request_text,
        category: prayer.category || 'General',
        is_urgent: false,
        is_answered: prayer.is_answered || false,
        prayer_count: prayer.prayer_count || 1,
        apostle_prayed: prayer.status === 'apostle_prayed'
      });

      if (error) {
        console.warn('Supabase prayer sync notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase prayer sync error (offline fallback active):', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Syncs a 1-on-1 pastoral booking into Supabase PostgreSQL
   */
  static async syncBooking(booking: ServiceBooking): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    try {
      const { error } = await supabase.from('service_bookings').insert({
        session_title: booking.service_type,
        minister_name: 'Apostle Joe Daniels',
        preferred_date: booking.date,
        preferred_time: booking.time_slot,
        status: booking.status || 'confirmed',
        zoom_link: booking.zoom_link
      });

      if (error) {
        console.warn('Supabase booking sync notice:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase booking sync error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Pulls latest remote rows from Supabase into local cache if tables exist
   */
  static async pullRemoteData(): Promise<{ prayersCount: number; sermonsCount: number }> {
    const supabase = getSupabase();
    if (!supabase) return { prayersCount: 0, sermonsCount: 0 };

    let prayersCount = 0;
    let sermonsCount = 0;

    try {
      // Pull prayers
      const { data: prayers, error: pErr } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!pErr && prayers && prayers.length > 0) {
        let localPrayers: any[] = [];
        try {
          const raw = localStorage.getItem('gcz_prayers');
          if (raw) localPrayers = JSON.parse(raw);
        } catch (_) {}
        const combined = [...prayers.map((p: any) => ({
          id: p.id,
          user_id: p.user_id || 'usr_remote',
          user_name: p.author_name || 'Church Believer',
          request_text: p.request_text,
          category: p.category || 'General',
          is_anonymous: false,
          is_public: true,
          prayer_count: p.prayer_count || 1,
          created_at: p.created_at,
          status: p.apostle_prayed ? ('apostle_prayed' as const) : ('approved' as const),
          is_answered: p.is_answered
        })), ...localPrayers.filter(lp => !prayers.some((rp: any) => rp.id === lp.id))];

        localStorage.setItem('gcz_prayers', JSON.stringify(combined));
        prayersCount = prayers.length;
      }
    } catch (e) {
      // Ignored for offline tolerance
    }

    try {
      // Pull sermons
      const { data: sermons, error: sErr } = await supabase
        .from('sermons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!sErr && sermons && sermons.length > 0) {
        sermonsCount = sermons.length;
      }
    } catch (e) {
      // Ignored for offline tolerance
    }

    return { prayersCount, sermonsCount };
  }
}
