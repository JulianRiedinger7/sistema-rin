-- DIAGNOSIS SCRIPT
-- Replace the email below to check what the database sees for your user.

DO $$
DECLARE
    target_email text := 'TU_EMAIL_DE_ADMIN@EJEMPLO.COM'; -- <--- REEMPLAZA ESTO
    user_record record;
    profile_record record;
BEGIN
    -- 1. Get Auth User
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE '❌ ERROR: No existe usuario en auth.users con email: %', target_email;
        RETURN;
    ELSE
        RAISE NOTICE '✅ Auth User encontrado. ID: %', user_record.id;
    END IF;

    -- 2. Get Profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = user_record.id;

    IF profile_record.id IS NULL THEN
        RAISE NOTICE '❌ PROFILE MISSING: El usuario existe pero NO tiene perfil en la tabla public.profiles.';
        RAISE NOTICE '   (Esto confirma por qué te redirige a onboarding)';
    ELSE
        RAISE NOTICE '✅ Perfil encontrado.';
        RAISE NOTICE '   Rol: %', profile_record.role;
        RAISE NOTICE '   Terminos Aceptados: %', profile_record.has_accepted_terms;
        
        IF profile_record.role = 'admin' AND profile_record.has_accepted_terms = true THEN
            RAISE NOTICE '🌟 TODO PARECE CORRECTO EN LA BASE DE DATOS. Si sigues con problemas, puede ser cache del navegador.';
        ELSE
            RAISE NOTICE '⚠️ DATOS INCORRECTOS: El rol debería ser admin y terminos true.';
        END IF;
    END IF;
END $$;
