import assert from 'node:assert/strict';
import { APP_VERSION } from './config';
import { CHANGELOG } from './changelog';

// A release changes both: the version shown in the footer and the newest entry of the update list.
assert.equal(CHANGELOG[0].version, APP_VERSION, 'the newest changelog entry is the running version');

const versions = CHANGELOG.map(entry => entry.version);
assert.equal(new Set(versions).size, versions.length, 'a version has one changelog entry');
const parts = versions.map(version => version.replace(/^v/, '').split('.').map(Number));
const newerThan = (a: number[], b: number[]) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
assert.ok(parts.every((part, index) => index === 0 || newerThan(parts[index - 1], part)), 'the newest entry is first, in falling order');
assert.ok(CHANGELOG[0].changes.at(-1)?.includes(APP_VERSION), 'the newest entry ends with the line that names the version');

console.log('Version tests passed');
