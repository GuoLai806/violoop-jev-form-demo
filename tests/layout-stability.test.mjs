import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('clip-only shell stylesheet loads after base CSS, without changing business scripts',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('./layout-stability.css')>html.indexOf('./styles.css'));
  const css=readFileSync(new URL('../layout-stability.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  assert.match(css,/^\s*\.shell\s*\{\s*overflow:\s*clip;\s*\}\s*$/);
  assert.equal((html.match(/<script /g)||[]).length,2);
});
