-- ============================================
-- SEED DATA: Datos de prueba para desarrollo local
-- Este archivo se ejecuta después de las migraciones
-- cuando corrés "supabase start" o "supabase db reset"
-- ============================================

-- =============================================
-- 1. CREAR USUARIOS DE PRUEBA EN AUTH
-- =============================================
-- Nota: El trigger handle_new_user crea automáticamente
-- el perfil en profiles con role='student'

-- ADMIN: admin@rin.com / admin123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'admin@rin.com',
  crypt('admin123', gen_salt('bf')),
  now(), 
  '{"full_name": "Admin RIN", "dni": "ADMIN001", "has_accepted_terms": true}'::jsonb,
  now(), now(), '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@rin.com"}'::jsonb,
  'email', 'a0000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- ALUMNO 1: 12345678@rin.com / 12345678 (Gym)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  '12345678@rin.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  '{"full_name": "Juan Pérez", "dni": "12345678", "has_accepted_terms": true}'::jsonb,
  now(), now(), '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  '{"sub": "b0000000-0000-0000-0000-000000000001", "email": "12345678@rin.com"}'::jsonb,
  'email', 'b0000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- ALUMNO 2: 87654321@rin.com / 87654321 (Pilates)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  '87654321@rin.com',
  crypt('87654321', gen_salt('bf')),
  now(),
  '{"full_name": "María López", "dni": "87654321", "has_accepted_terms": true}'::jsonb,
  now(), now(), '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  '{"sub": "b0000000-0000-0000-0000-000000000002", "email": "87654321@rin.com"}'::jsonb,
  'email', 'b0000000-0000-0000-0000-000000000002',
  now(), now(), now()
);

-- =============================================
-- 2. ACTUALIZAR PERFILES
-- El trigger handle_new_user ya los creó como 'student'
-- Ahora actualizamos el admin y completamos datos
-- =============================================

-- Hacer admin al primer usuario y marcar perfil completo
UPDATE profiles SET 
  role = 'admin', 
  has_accepted_terms = true,
  phone = '1234567890',
  activity_type = 'mixed'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Configurar alumno 1 (Gym) - perfil completo
UPDATE profiles SET 
  activity_type = 'gym',
  has_accepted_terms = true,
  phone = '1111111111',
  date_of_birth = '2000-01-15'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Configurar alumno 2 (Pilates) - perfil completo
UPDATE profiles SET 
  activity_type = 'pilates',
  has_accepted_terms = true,
  phone = '2222222222',
  date_of_birth = '1998-06-20'
WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- =============================================
-- 3. CREAR HEALTH SHEETS (Fichas de Salud)
-- Sin esto, dashboard/page.tsx redirige students a onboarding
-- =============================================

-- Health sheet para Admin
INSERT INTO health_sheets (id, user_id, injuries, allergies, goals, medical_conditions)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Ninguna', 'Ninguna', 'Administrar el gimnasio', 'Ninguna'
);

-- Health sheet para Alumno 1 (Juan - Gym)
INSERT INTO health_sheets (id, user_id, injuries, allergies, goals, medical_conditions)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Ninguna', 'Ninguna', 'Ganar masa muscular', 'Ninguna'
);

-- Health sheet para Alumno 2 (María - Pilates)
INSERT INTO health_sheets (id, user_id, injuries, allergies, goals, medical_conditions)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000002',
  'Dolor lumbar leve', 'Ninguna', 'Mejorar flexibilidad', 'Ninguna'
);

-- =============================================
-- 4. INSERTAR EJERCICIOS DE EJEMPLO
-- =============================================
INSERT INTO exercises (id, name, muscle_group, category) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Press Banca', 'Pecho', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000002', 'Sentadilla', 'Piernas', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000003', 'Peso Muerto', 'Espalda', 'Potencia'),
  ('e0000000-0000-0000-0000-000000000004', 'Press Militar', 'Hombros', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000005', 'Curl Bíceps', 'Brazos', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000006', 'Extensiones Tríceps', 'Brazos', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000007', 'Reformer Básico', 'Core', 'Pilates'),
  ('e0000000-0000-0000-0000-000000000008', 'Mat Pilates', 'Core', 'Pilates'),
  ('e0000000-0000-0000-0000-000000000009', 'Dominadas', 'Espalda', 'Fuerza'),
  ('e0000000-0000-0000-0000-000000000010', 'Remo con Barra', 'Espalda', 'Fuerza')
ON CONFLICT DO NOTHING;
