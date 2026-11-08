import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalRedirect } from '../lib/canonical-host';

const siteUrl = 'https://taycoturnkey.com';
const go = (host: string, pathname = '/', search = '', method = 'GET', url: string | undefined = siteUrl) =>
  canonicalRedirect({ method, host, pathname, search, siteUrl: url });

test('the other TAYCO addresses send page loads to the official one, keeping path and query', () => {
  assert.equal(go('tayco.llc', '/townhomes', '?x=1'), 'https://taycoturnkey.com/townhomes?x=1');
  assert.equal(go('www.tayco.llc'), 'https://taycoturnkey.com/');
  assert.equal(go('www.tayroofing.org', '/portal'), 'https://taycoturnkey.com/portal');
  assert.equal(go('TAYROOFING.ORG:443', '/estimate', '', 'HEAD'), 'https://taycoturnkey.com/estimate');
  assert.equal(go('www.taycoturnkey.com', '/commercial'), 'https://taycoturnkey.com/commercial');
});

test('the official address, unknown hosts, APIs, writes and an unset official URL are never redirected', () => {
  assert.equal(go('taycoturnkey.com', '/townhomes'), null);
  assert.equal(go('tayco-website-production-7e01.up.railway.app'), null, 'Railway health checks stay on their host');
  assert.equal(go('evil.example'), null);
  assert.equal(go('tayco.llc', '/api/auth/login'), null, 'API calls keep working where the session is');
  assert.equal(go('tayco.llc', '/api'), null);
  assert.equal(go('tayco.llc', '/login', '', 'POST'), null, 'a POST must not become a GET');
  assert.equal(canonicalRedirect({ method: 'GET', host: 'tayco.llc', pathname: '/', search: '', siteUrl: undefined }), null);
  assert.equal(go('tayco.llc', '/', '', 'GET', 'not a url'), null);
});
