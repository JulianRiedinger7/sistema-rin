-- DIAGNOSTICO SIMPLE (SELECT)
-- Reemplaza el email abajo y corre esto. Veras el resultado en la tabla de abajo.

SELECT 
    u.email,
    u.id as auth_id,
    p.id as profile_id,
    p.role,
    p.has_accepted_terms
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'TU_EMAIL_DE_ADMIN@EJEMPLO.COM'; -- <--- REEMPLAZA ESTO
