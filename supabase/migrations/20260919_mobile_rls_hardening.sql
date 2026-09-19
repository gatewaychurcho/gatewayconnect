-- GatewayConnect mobile security hardening.
-- Run after the existing schema migrations.
-- This removes the permissive policies used during development.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'user_follows', 'follows', 'posts', 'post_comments',
    'community_stories', 'prayer_requests', 'service_bookings', 'donations',
    'orders', 'direct_messages', 'messages', 'group_members', 'carts',
    'cart_items', 'profile_pictures', 'message_reactions', 'receipts'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access %I" ON public.%I', table_name, table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Public read-only content.
CREATE POLICY "mobile read sermons" ON public.sermons FOR SELECT USING (true);
CREATE POLICY "mobile read devotionals" ON public.devotionals FOR SELECT USING (true);
CREATE POLICY "mobile read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "mobile read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "mobile read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "mobile read approved prayers" ON public.prayer_requests FOR SELECT USING (is_public = true AND status <> 'pending');

-- Authenticated member profile access. The app uses text IDs matching auth.uid().
CREATE POLICY "mobile own profile select" ON public.users FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "mobile own profile update" ON public.users FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY "mobile member profile insert" ON public.users FOR INSERT WITH CHECK (id = auth.uid()::text);

CREATE POLICY "mobile own prayer insert" ON public.prayer_requests FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "mobile own prayer update" ON public.prayer_requests FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "mobile own prayer delete" ON public.prayer_requests FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "mobile post comment insert" ON public.post_comments FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "mobile own comment update" ON public.post_comments FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "mobile own comment delete" ON public.post_comments FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "mobile own messages" ON public.messages FOR SELECT USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text);
CREATE POLICY "mobile message insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid()::text);
CREATE POLICY "mobile own message update" ON public.messages FOR UPDATE USING (sender_id = auth.uid()::text) WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "mobile own direct messages" ON public.direct_messages FOR SELECT USING (sender_id = auth.uid()::text OR receiver_id = auth.uid()::text);
CREATE POLICY "mobile direct message insert" ON public.direct_messages FOR INSERT WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "mobile own bookings" ON public.service_bookings FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "mobile booking insert" ON public.service_bookings FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Payment writes are server-only. There is deliberately no client INSERT policy for donations or receipts.
REVOKE INSERT, UPDATE, DELETE ON public.donations FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.receipts FROM anon, authenticated;
