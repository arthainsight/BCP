import assert from 'node:assert/strict';
import { reportDate, reportTitle } from './report';

assert.equal(reportDate(new Date(2026, 9, 12)), '12.10.2026', 'day.month.year');
assert.equal(reportDate(new Date(2027, 0, 8)), '08.01.2027', 'with leading zeros');
assert.equal(reportTitle('Maria', '15.08.1947 09.15.00', 'Chart report'), 'Chart report · Maria');
assert.equal(reportTitle('  Maria  ', '', 'Chart report'), 'Chart report · Maria', 'the name without the spaces around it');
assert.equal(reportTitle(null, '15.08.1947 09.15.00', 'Chart report'), 'Chart report · 15.08.1947', 'no name: the day of birth');
assert.equal(reportTitle('', '  ', 'Chart report'), 'Chart report', 'nothing to add');

console.log('Report tests passed');
