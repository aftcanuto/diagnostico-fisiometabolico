const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('../tmp/jump-validation/node_modules/@electric-sql/pglite');
async function main() {
  const db = new PGlite();
  const me = '10000000-0000-0000-0000-000000000001';
  const peer = '10000000-0000-0000-0000-000000000002';
  const stranger = '10000000-0000-0000-0000-000000000003';
  const clinic = '20000000-0000-0000-0000-000000000001';
  const other = '20000000-0000-0000-0000-000000000002';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table clinica_membros(clinica_id uuid,user_id uuid,ativo boolean);
      create table pacientes(id uuid primary key,clinica_id uuid);
      create table avaliacoes(id uuid primary key,clinica_id uuid);
      create table avaliadores(id uuid primary key,nome text);
      grant usage on schema auth to authenticated;
      grant select on clinica_membros to authenticated;
      insert into clinica_membros values('${clinic}','${me}',true),('${clinic}','${peer}',true),('${other}','${stranger}',true);
      insert into pacientes values('${me}','${clinic}'),('${stranger}','${other}');
      insert into avaliacoes select * from pacientes;
      insert into avaliadores values('${me}','self'),('${peer}','peer'),('${stranger}','stranger');`);
    await db.exec(fs.readFileSync('supabase/migrations/027_clinica_membership_rls_fix.sql','utf8').split('drop policy')[0]);
    const sql = fs.readFileSync('supabase/migrations/20260924133821_restore_core_rls.sql','utf8');
    await db.exec(sql); await db.exec(sql);
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${me}';`);
    for (const table of ['pacientes','avaliacoes']) {
      assert.equal((await db.query(`select * from ${table}`)).rows.length,1);
      await assert.rejects(db.query(`update ${table} set clinica_id=$1 where id=$2`,[other,me]));
      await assert.rejects(db.query(`insert into ${table} values($1,$2)`,[peer,other]));
    }
    assert.equal((await db.query('select * from avaliadores')).rows.length,2);
    assert.equal((await db.query('update avaliadores set nome=$1 where id=$2 returning id',['changed',peer])).rows.length,0);
    assert.equal((await db.query('update avaliadores set nome=$1 where id=$2 returning id',['changed',me])).rows.length,1);
    await assert.rejects(db.query('delete from avaliadores where id=$1',[me]));
    await db.exec('reset role; set role anon');
    for (const table of ['pacientes','avaliacoes','avaliadores']) await assert.rejects(db.query(`select * from ${table}`));
    console.log('Core RLS: isolamento entre clinicas, perfil proprio, colegas, bloqueio anonimo e reaplicacao aprovados.');
  } finally { await db.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
