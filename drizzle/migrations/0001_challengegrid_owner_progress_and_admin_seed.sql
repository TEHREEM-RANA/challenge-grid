CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF NEW.email = 'tehreemr61@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_challenge_progress_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.challenges
    WHERE id = NEW.challenge_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Challenge progress must belong to the challenge owner';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_challenge_progress_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_challenge_progress_owner
BEFORE INSERT OR UPDATE ON public.challenge_progress
FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_progress_owner();