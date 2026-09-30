const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('../tmp/jump-validation/node_modules/@electric-sql/pglite');

async function main() {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated;
      create table public.antropometria(id integer primary key, owner_name text, peso numeric, dobras jsonb);
      create table public.avaliadores(id integer primary key);
      alter table public.antropometria enable row level security;
      create policy owner_only on public.antropometria to authenticated using(owner_name=current_setting('app.user')) with check(owner_name=current_setting('app.user'));
      grant select,insert,update on public.antropometria to authenticated;
      insert into public.antropometria values(1,'a',70,'{"legado":12}'),(2,'b',80,'{}');`);
    const before = (await db.query('select id,owner_name,peso,dobras from public.antropometria order by id')).rows;
    const sql = fs.readFileSync('supabase/migrations/20260928170549_anthropometry_v2.sql', 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    assert.deepEqual((await db.query('select id,owner_name,peso,dobras from public.antropometria order by id')).rows, before);
    for (const assignment of [
      `registro_v2='{}',resultados_v2='{}',revision_v2=1`,
      `registro_v2='{"version":2}',resultados_v2='{}',revision_v2=1`,
      `registro_v2='{"version":2}',resultados_v2='{"version":2}',revision_v2=0`,
      `registro_v2='{"version":2}'`,
    ]) await assert.rejects(db.exec(`update public.antropometria set ${assignment} where id=1`));
    await db.exec(`set role authenticated; select set_config('app.user','a',false);`);
    assert.equal((await db.query('select * from public.antropometria')).rows.length, 1);
    await db.exec(`update public.antropometria set registro_v2='{"version":2}',resultados_v2='{"version":2}',revision_v2=1 where id=1`);
    assert.equal((await db.query('update public.antropometria set revision_v2=2 where id=1 and revision_v2=1 returning id')).rows.length, 1);
    assert.equal((await db.query('update public.antropometria set revision_v2=3 where id=1 and revision_v2=1 returning id')).rows.length, 0);
    assert.equal((await db.query('update public.antropometria set peso=99 where id=2 returning id')).rows.length, 0);
    console.log('Antropometria migration: reaplicacao, legado preservado, constraints, concorrencia e RLS local aprovados.');
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
