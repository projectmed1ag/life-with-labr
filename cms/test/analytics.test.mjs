import test from 'node:test';
import assert from 'node:assert/strict';
import {installAnalytics, messengerClick} from '../../dist/analytics.js';

test('messenger goals include the puppy and litter, never the message or URL parameters', () => {
  const event = messengerClick('https://t.me/+79251448648?text=private-message', {
    pathname: '/en/puppies/edel-enot/?utm_source=yandex#amelia', puppyId: 'amelia', placement: 'puppy',
  });
  assert.deepEqual(event, {channel:'telegram',page:'/en/puppies/edel-enot/',placement:'puppy',litter:'edel-enot',puppy:'amelia'});
  assert.equal(messengerClick('https://wa.me/79251448648?text=hello').channel, 'whatsapp');
});

test('menus, photographs, social profiles, phone calls and lookalike hosts are not messenger goals', () => {
  for (const href of ['#contacts', '/assets/puppy.jpg', 'https://vk.ru/id100340707', 'tel:+79251448648',
    'https://wa.me.example.org/79251448648', 'https://wa.me/another-number', 'https://t.me/another-channel',
    'http://wa.me/79251448648', 'https://user@wa.me/79251448648']) assert.equal(messengerClick(href), null, href);
});

function browser(url = 'https://lifewithlabr.ru/puppies/edel-enot/') {
  const calls = [], scripts = [], handlers = new Map();
  return {
    calls, scripts, handlers,
    win: {location: new URL(url), ym: (...args) => calls.push(args)},
    doc: {scripts, head: {append: script => scripts.push(script)}, createElement: () => ({}),
      addEventListener: (name, handler) => handlers.set(name, handler)},
  };
}

test('preview, admin and an unconfigured counter send no analytics', () => {
  for (const url of ['http://127.0.0.1:4180/', 'https://admin.lifewithlabr.ru/', 'https://lifewithlabr.ru/admin/']) {
    const b = browser(url);
    assert.equal(installAnalytics(b.win, b.doc, 123), false);
    assert.equal(b.calls.length, 0);
    assert.equal(b.scripts.length, 0);
  }
  const b = browser();
  assert.equal(installAnalytics(b.win, b.doc, 0), false);
});

test('one real link click records one goal without intercepting navigation', () => {
  const b = browser();
  assert.equal(installAnalytics(b.win, b.doc, 123), true);
  assert.equal(installAnalytics(b.win, b.doc, 123), false);
  const link = {href:'https://wa.me/79251448648?text=private-message',dataset:{puppyContact:'amelia'},closest:()=>null};
  const event = {type:'click',button:0,target:{closest:()=>link},preventDefault:()=>assert.fail('Navigation was intercepted')};
  b.handlers.get('click')(event);
  assert.deepEqual(b.calls[1], [123,'reachGoal','messenger_click',{
    channel:'whatsapp',page:'/puppies/edel-enot/',placement:'puppy',litter:'edel-enot',puppy:'amelia',
  }]);
  b.handlers.get('click')({...event,defaultPrevented:true});
  b.handlers.get('click')({...event,target:{closest:()=>null}});
  b.handlers.get('auxclick')({...event,type:'auxclick',button:2});
  assert.equal(b.calls.length, 2);
  b.handlers.get('auxclick')({...event,type:'auxclick',button:1});
  assert.equal(b.calls.length, 3);
  assert.equal(b.scripts.length, 1);
  for (const option of ['webvisor','clickmap','trackLinks','trackHash']) assert.equal(b.calls[0][2][option], false);
  b.win.ym = () => { throw new Error('Blocked'); };
  assert.doesNotThrow(() => b.handlers.get('click')(event));
});
