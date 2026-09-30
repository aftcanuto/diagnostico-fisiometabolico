import assert from 'node:assert/strict';
import { qualificationLabel, qualificationSchema } from '../src/lib/isak-qualification';

const confirmed = { status: 'confirmed', level: 1, selfAttested: true, expiry: '2026-09-28' };
for (const value of [null, undefined, {}, { status: 'none' }, { status: 'pending' }, { ...confirmed, selfAttested: false }, { ...confirmed, selfAttested: undefined }]) {
  assert.equal(qualificationLabel(value, '2026-09-28'), '');
}
for (const level of [1, 2, 3, 4]) {
  assert.equal(qualificationLabel({ status: 'pending', level }), `ISAK Nível ${level}`);
  assert.equal(qualificationLabel({ ...confirmed, level }, '2026-09-28'), `Antropometrista ISAK Nível ${level}`);
}
assert.equal(qualificationLabel(confirmed, '2026-09-29'), '');
assert.equal(qualificationLabel(confirmed, '2026-09-27'), 'Antropometrista ISAK Nível 1');
assert.equal(qualificationLabel(confirmed, new Date('2026-09-28T23:59:59Z')), 'Antropometrista ISAK Nível 1');
assert.equal(qualificationLabel({ ...confirmed, expiry: undefined }, '2026-09-28'), '');
assert.equal(qualificationLabel({ ...confirmed, level: undefined }, '2026-09-28'), '');
assert.equal(qualificationLabel(confirmed, new Date('invalid')), '');
for (const expiry of ['2026-02-29', '2024-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '0000-01-01', '2026-9-1', 'invalid', '', '2026-09-28T00:00:00Z']) {
  assert.equal(qualificationSchema.safeParse({ ...confirmed, expiry }).success, false, expiry);
  assert.equal(qualificationLabel(confirmed, expiry), '', expiry);
}
assert.equal(qualificationSchema.safeParse({ ...confirmed, expiry: '2024-02-29' }).success, true);
for (const level of [0, 5, 1.5, '1', null]) {
  assert.equal(qualificationSchema.safeParse({ ...confirmed, level }).success, false);
}
assert.equal(qualificationSchema.safeParse({ ...confirmed, selfAttested: 'true' }).success, false);
assert.deepEqual(qualificationSchema.parse({ status: 'pending', level: 1 }), { status: 'pending', level: 1 });
assert.equal(qualificationSchema.safeParse({ ...confirmed, number: '   ' }).success, false);
console.log('ISAK qualification schema and formatter tests passed.');
