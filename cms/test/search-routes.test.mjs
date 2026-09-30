import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.mjs';

test('Search aliases redirect in one hop; unknown pages are not soft 404s', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'lwl-search-'));
  const {server} = await createApplication({dataDir:dir, development:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const prefix of ['', '/en']) {
      for (const [alias, canonical] of [['/index.html','/'], ['/puppies.html','/puppies/'], ['/about.html','/about/'], ['/puppies/index.html','/puppies/'], ['/dogs/edel/index.html','/dogs/edel/'], ['/puppies/edel-enot/index.html','/puppies/edel-enot/'], ['/moments/index.html','/gallery/'], ['/moments.html','/gallery/']]) {
        for (const method of ['GET','HEAD']) {
          const response = await fetch(origin+prefix+alias+'?utm_source=test', {method, redirect:'manual'});
          assert.equal(response.status, 308, prefix+alias);
          assert.equal(response.headers.get('location'), prefix+canonical+'?utm_source=test');
        }
        assert.equal((await fetch(origin+prefix+canonical, {redirect:'manual'})).status, 200);
      }
      assert.equal((await fetch(origin+prefix+'/dogs/unknown/index.html', {redirect:'manual'})).status, 404);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(dir, {recursive:true, force:true});
  }
});
