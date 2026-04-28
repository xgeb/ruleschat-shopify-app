import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { chunkText, retrieveRelevantChunks } from '../public/widget-utils.js';


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

  const documentArrayMatch = widgetScript.match(/documents:\s*\[((?:.|\n)*?)\n\s*\],/);
  assert.ok(documentArrayMatch, 'Expected documents config array.');
  const documentTitles = documentArrayMatch[1].match(/title: '.*?'/g) ?? [];
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

  assert.ok(
    html.includes('data-save-settings'),
    'Expected save settings button to be present.'
  );

  const configStore = await fs.readFile(
    path.join(projectRoot, 'public', 'config-store.js'),
    'utf8'
  );
  assert.ok(
    configStore.includes('ruleschat:config:v1'),
    'Expected localStorage config key to be defined.'
  );

  const chunked = chunkText('one two three four five six seven eight nine ten', {
    maxWords: 4,
  });
  assert.deepEqual(
    chunked,
    ['one two three four', 'five six seven eight', 'nine ten'],
    'Expected chunking to split text into word-limited segments.'
  );

  const mockChunks = [
    {
      documentTitle: 'Doc A',
      pageNumber: 1,
      chunkIndex: 0,
      content: 'Weapons must be padded and inspected before combat.',
    },
    {
      documentTitle: 'Doc B',
      pageNumber: 2,
      chunkIndex: 0,
      content: 'Food vendors must comply with venue policies.',
    },
  ];
  const results = retrieveRelevantChunks('weapons inspection rules', mockChunks);
  assert.equal(results[0].documentTitle, 'Doc A');
  assert.equal(
    results.length,
    1,
    'Expected retrieval to filter unrelated chunks.'
  );

  console.log('All milestone 2 tests passed.');

};

run();
