-- ============================================================
--  007 - Tornar bucket 'posturografia' público (para servir logos)
-- ============================================================
-- O bucket continua protegido para WRITE (só dono pode subir),
-- mas o READ vira público. Logo da clínica e fotos posturais
-- são URLs públicas conhecidas apenas por quem tem o link.

update storage.buckets set public = true where id = 'posturografia';
