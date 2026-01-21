-- FIX ADMIN PROFILE BY EMAIL
-- Replace 'TU_EMAIL_DE_ADMIN@EJEMPLO.COM' with your actual login email.

DO $$
DECLARE
    target_email text := 'TU_EMAIL_DE_ADMIN@EJEMPLO.COM'; -- <--- PONE TU EMAIL AQUI
    user_record record;
BEGIN
    -- 1. Find the user in auth.users
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;

    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'No se encontro un usuario con el email %', target_email;
    END IF;

    -- 2. Insert or Update the profile
    INSERT INTO public.profiles (id, full_name, role, has_accepted_terms)
    VALUES (
        user_record.id, 
        'Administrador Principal', 
        'admin',
        true -- Set accepted terms to true to bypass onboarding
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        role = 'admin',
        has_accepted_terms = true; 
        
    RAISE NOTICE 'Usuario % actualizado a ADMIN correctamente.', target_email;
END $$;
