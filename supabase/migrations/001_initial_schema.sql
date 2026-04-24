-- supabase/migrations/001_initial_schema.sql
-- Ladder B session 54 (2026-04-24) — captured from prod via pg_dump --schema-only.
-- Snapshot of public schema as of commit 992aa14 (post-migrations 002-008).
--
-- Migrations 002-008 remain in this folder as historical evolution record,
-- but fresh-env bootstrap only needs this file. See docs/ladder-b-design.md.
--
-- 🖐️ HITL APPLY: run via psql against a fresh Supabase project, or paste into
--   the Supabase dashboard SQL editor. Safe to re-run (CREATE TABLE IF NOT EXISTS
--   guards prevent duplicate-table errors on retry).
--
-- NOTE: is_treehouse_admin() hardcodes david@zenforged.com as admin email.
-- Admin ops bypass RLS via service_role, so this RLS check is vestigial.
-- Preserved here for faithfulness to prod; cleanup is a separate task.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: post_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status AS ENUM (
    'available',
    'sold'
);


--
-- Name: is_treehouse_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_treehouse_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  SELECT (auth.jwt() ->> 'email') = 'david@zenforged.com'
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: malls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.malls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    slug text NOT NULL,
    address text,
    phone text,
    website text,
    google_maps_url text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    category text,
    zip_code text
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vendor_id uuid NOT NULL,
    mall_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    caption text,
    image_url text,
    price_asking numeric(10,2),
    status public.post_status DEFAULT 'available'::public.post_status NOT NULL,
    location_label text,
    CONSTRAINT price_asking_nonnegative CHECK (((price_asking IS NULL) OR (price_asking >= (0)::numeric)))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.site_settings (
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: vendor_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.vendor_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    booth_number text,
    mall_id uuid,
    mall_name text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    first_name text,
    last_name text,
    booth_name text,
    proof_image_url text
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    mall_id uuid NOT NULL,
    display_name text NOT NULL,
    booth_number text,
    bio text,
    avatar_url text,
    slug text NOT NULL,
    facebook_url text,
    hero_image_url text
);


--
-- Name: malls malls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_pkey PRIMARY KEY (id);


--
-- Name: malls malls_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_slug_key UNIQUE (slug);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: vendor_requests vendor_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_requests
    ADD CONSTRAINT vendor_requests_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_mall_booth_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_mall_booth_unique UNIQUE (mall_id, booth_number);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_slug_key UNIQUE (slug);


--
-- Name: idx_malls_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_malls_slug ON public.malls USING btree (slug);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);


--
-- Name: idx_posts_mall_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_mall_id ON public.posts USING btree (mall_id);


--
-- Name: idx_posts_mall_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_mall_status_created ON public.posts USING btree (mall_id, status, created_at DESC);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_posts_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_vendor_id ON public.posts USING btree (vendor_id);


--
-- Name: idx_vendors_mall_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_mall_id ON public.vendors USING btree (mall_id);


--
-- Name: idx_vendors_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_slug ON public.vendors USING btree (slug);


--
-- Name: idx_vendors_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_user_id ON public.vendors USING btree (user_id);


--
-- Name: vendor_requests_email_booth_pending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vendor_requests_email_booth_pending_idx ON public.vendor_requests USING btree (lower(email), mall_id, booth_number) WHERE (status = 'pending'::text);


--
-- Name: malls set_updated_at_malls; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_malls BEFORE UPDATE ON public.malls FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: posts set_updated_at_posts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendors set_updated_at_vendors; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_vendors BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: posts posts_mall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_mall_id_fkey FOREIGN KEY (mall_id) REFERENCES public.malls(id) ON DELETE CASCADE;


--
-- Name: posts posts_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: site_settings site_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: vendor_requests vendor_requests_mall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_requests
    ADD CONSTRAINT vendor_requests_mall_id_fkey FOREIGN KEY (mall_id) REFERENCES public.malls(id);


--
-- Name: vendors vendors_mall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_mall_id_fkey FOREIGN KEY (mall_id) REFERENCES public.malls(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: malls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.malls ENABLE ROW LEVEL SECURITY;

--
-- Name: malls malls: admin delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "malls: admin delete" ON public.malls FOR DELETE USING (public.is_treehouse_admin());


--
-- Name: malls malls: admin insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "malls: admin insert" ON public.malls FOR INSERT WITH CHECK (public.is_treehouse_admin());


--
-- Name: malls malls: admin update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "malls: admin update" ON public.malls FOR UPDATE USING (public.is_treehouse_admin());


--
-- Name: malls malls: public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "malls: public read" ON public.malls FOR SELECT USING (true);


--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: posts posts: owner or admin delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "posts: owner or admin delete" ON public.posts FOR DELETE USING ((public.is_treehouse_admin() OR (EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = posts.vendor_id) AND (vendors.user_id = auth.uid()))))));


--
-- Name: posts posts: owner or admin insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "posts: owner or admin insert" ON public.posts FOR INSERT WITH CHECK ((public.is_treehouse_admin() OR (EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = posts.vendor_id) AND (vendors.user_id = auth.uid()))))));


--
-- Name: posts posts: owner or admin update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "posts: owner or admin update" ON public.posts FOR UPDATE USING ((public.is_treehouse_admin() OR (EXISTS ( SELECT 1
   FROM public.vendors
  WHERE ((vendors.id = posts.vendor_id) AND (vendors.user_id = auth.uid()))))));


--
-- Name: posts posts: public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "posts: public read" ON public.posts FOR SELECT USING (true);


--
-- Name: vendor_requests service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service role only" ON public.vendor_requests USING (false) WITH CHECK (false);


--
-- Name: site_settings site_settings_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT TO authenticated, anon USING (true);


--
-- Name: vendor_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

--
-- Name: vendors vendors: admin delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vendors: admin delete" ON public.vendors FOR DELETE USING (public.is_treehouse_admin());


--
-- Name: vendors vendors: owner or admin insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vendors: owner or admin insert" ON public.vendors FOR INSERT WITH CHECK (((user_id = auth.uid()) OR public.is_treehouse_admin()));


--
-- Name: vendors vendors: owner or admin update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vendors: owner or admin update" ON public.vendors FOR UPDATE USING (((user_id = auth.uid()) OR public.is_treehouse_admin()));


--
-- Name: vendors vendors: public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "vendors: public read" ON public.vendors FOR SELECT USING (true);


--
-- PostgreSQL database dump complete
--


