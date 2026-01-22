import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'public', 'index.html');

const run = async () => {
  const html = await fs.readFile(indexPath, 'utf8');
  const widgetScript = await fs.readFile(
    path.join(projectRoot, 'public', 'widget.js'),
    'utf8'
  );

  assert.ok(
    html.includes('data-documents-list'),
    'Expected documents list placeholder to be present.'
  );

  assert.ok(
    html.includes('data-admin-documents'),
    'Expected admin document editor placeholder to be present.'
  );

  assert.ok(
    html.includes('Uploadi') && html.includes('hosted PDF link'),
    'Expected admin upload note placeholder.'
  );

  const documentConfigMatch = widgetScript.match(/documents:\s*\[/);
  assert.ok(documentConfigMatch, 'Expected documents config array.');

  const documentTitles = widgetScript.match(/title: '.*?'/g) ?? [];
  assert.equal(
    documentTitles.length,
    8,
    'Expected eight document slots in configuration.'
  );

  assert.ok(
    html.includes('maxlength="250"'),
    'Expected chat input to enforce 250 character limit.'
  );

  assert.ok(
    widgetScript.includes('Answers are based only on the posted rule documents.'),
    'Expected notice about document-only answers.'
  );

  console.log('All milestone 1 tests passed.');
};

run();
