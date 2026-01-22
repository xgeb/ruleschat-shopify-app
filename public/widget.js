import {
  chunkText,
  retrieveRelevantChunks,
} from './widget-utils.js';

const config = {
  widgetTitle: 'RulesChat',
  widgetEyebrow: 'League Rules',
  widgetNotice: 'Answers are based only on the posted rule documents.',
  documents: [
    { title: 'Core Rulebook', url: '', file: null, chunks: [] },
    { title: 'Safety Manual', url: '', file: null, chunks: [] },
    { title: 'Weapon Specs', url: '', file: null, chunks: [] },
    { title: 'Armor Guide', url: '', file: null, chunks: [] },
    { title: 'Event Policies', url: '', file: null, chunks: [] },
    { title: 'Referee Notes', url: '', file: null, chunks: [] },
    { title: 'Supplement A', url: '', file: null, chunks: [] },
    { title: 'Supplement B', url: '', file: null, chunks: [] },
  ],
};

const form = document.querySelector('.chat__composer');
const input = document.querySelector('#chat-input');
const messages = document.querySelector('.chat__messages');
const documentsList = document.querySelector('[data-documents-list]');
const adminDocuments = document.querySelector('[data-admin-documents]');
const titleNode = document.querySelector('[data-widget-title]');
const eyebrowNode = document.querySelector('[data-widget-eyebrow]');
const noticeNode = document.querySelector('[data-widget-notice]');

const ensurePdfLib = () => {
  if (!window.pdfjsLib) {
    throw new Error('PDF library not available.');
  }

  return window.pdfjsLib;
};

const extractPdfText = async (file) => {
  const pdfjsLib = ensurePdfLib();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    pages.push({ pageNumber, text: pageText });
  }

  return pages;
};

const buildChunks = (pages, documentTitle) => {
  return pages.flatMap((page) => {
    const chunks = chunkText(page.text);
    return chunks.map((chunk, index) => ({
      documentTitle,
      pageNumber: page.pageNumber,
      chunkIndex: index,
      content: chunk,
    }));
  });
};

const addMessage = (content, label) => {
  const message = document.createElement('article');
  message.className = 'message';

  const messageLabel = document.createElement('p');
  messageLabel.className = 'message__label';
  messageLabel.textContent = label;

  const messageBody = document.createElement('p');
  messageBody.textContent = content;

  message.append(messageLabel, messageBody);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
};

const addEscalationMessage = () => {
  const message = document.createElement('article');
  message.className = 'message';

  const messageLabel = document.createElement('p');
  messageLabel.className = 'message__label';
  messageLabel.textContent = 'RulesChat';

  const messageBody = document.createElement('p');
  messageBody.textContent =
    'I cannot find this in the posted documents.';

  const actionButton = document.createElement('button');
  actionButton.type = 'button';
  actionButton.className = 'message__action';
  actionButton.textContent = 'Send this question to the league';
  actionButton.addEventListener('click', () => {
    actionButton.disabled = true;
    actionButton.textContent = 'Sending is not enabled yet.';
  });

  message.append(messageLabel, messageBody, actionButton);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
};

const renderDocuments = () => {
  documentsList.innerHTML = '';

  config.documents.forEach((doc, index) => {
    const item = document.createElement('li');
    item.className = 'documents__item';

    const link = document.createElement('a');
    link.className = 'documents__link';
    link.href = doc.url || '#';
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.setAttribute('aria-label', `Open ${doc.title} document`);

    const icon = document.createElement('span');
    icon.className = 'documents__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'PDF';

    const label = document.createElement('span');
    label.textContent = doc.title || `Document ${index + 1}`;

    link.append(icon, label);
    item.append(link);
    documentsList.append(item);
  });
};

const renderAdminDocuments = () => {
  adminDocuments.innerHTML = '';

  config.documents.forEach((doc, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin__document';

    const title = document.createElement('p');
    title.className = 'admin__document-title';
    title.textContent = `Document ${index + 1}`;

    const fields = document.createElement('div');
    fields.className = 'admin__document-fields';

    const nameField = document.createElement('div');
    nameField.className = 'admin__document-field';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Display name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = doc.title;
    nameInput.addEventListener('input', (event) => {
      doc.title = event.target.value;
      renderDocuments();
    });
    nameField.append(nameLabel, nameInput);

    const urlField = document.createElement('div');
    urlField.className = 'admin__document-field';
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'PDF URL (hosted)';
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'https://example.com/rules.pdf';
    urlInput.value = doc.url;
    urlInput.addEventListener('input', (event) => {
      doc.url = event.target.value;
      renderDocuments();
    });
    urlField.append(urlLabel, urlInput);

    const fileField = document.createElement('div');
    fileField.className = 'admin__document-field';
    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Upload PDF';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    const fileStatus = document.createElement('p');
    fileStatus.className = 'admin__file-status';
    fileStatus.textContent = doc.file
      ? `Uploaded: ${doc.file.name}`
      : 'No file uploaded yet.';
    fileInput.addEventListener('change', async (event) => {
      const [file] = event.target.files ?? [];
      if (!file) {
        return;
      }
      doc.file = file;
      fileStatus.textContent = `Processing: ${file.name}`;
      try {
        const pages = await extractPdfText(file);
        doc.chunks = buildChunks(pages, doc.title);
        fileStatus.textContent = `Uploaded: ${file.name} (${doc.chunks.length} chunks)`;
      } catch (error) {
        console.error(error);
        fileStatus.textContent =
          'Unable to process PDF. Please try another file.';
      }
    });
    fileField.append(fileLabel, fileInput, fileStatus);

    fields.append(nameField, urlField, fileField);
    wrapper.append(title, fields);
    adminDocuments.append(wrapper);
  });
};

const syncHeaderInputs = () => {
  const titleInput = document.querySelector('#admin-title-input');
  const eyebrowInput = document.querySelector('#admin-eyebrow-input');
  const noticeInput = document.querySelector('#admin-notice-input');

  titleInput.addEventListener('input', (event) => {
    config.widgetTitle = event.target.value;
    titleNode.textContent = config.widgetTitle;
  });

  eyebrowInput.addEventListener('input', (event) => {
    config.widgetEyebrow = event.target.value;
    eyebrowNode.textContent = config.widgetEyebrow;
  });

  noticeInput.addEventListener('input', (event) => {
    config.widgetNotice = event.target.value;
    noticeNode.textContent = config.widgetNotice;
  });
};

syncHeaderInputs();
renderDocuments();
renderAdminDocuments();

const findAnswer = (question) => {
  const allChunks = config.documents.flatMap((doc) =>
    doc.chunks.map((chunk) => ({
      ...chunk,
      documentTitle: doc.title,
    }))
  );

  const matches = retrieveRelevantChunks(question, allChunks);
  if (matches.length === 0) {
    return null;
  }

  const topMatch = matches[0];
  return {
    documentTitle: topMatch.documentTitle,
    pageNumber: topMatch.pageNumber,
    quote: topMatch.content,
  };
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    return;
  }

  addMessage(value, 'You');
  const answer = findAnswer(value);

  if (!answer) {
    addEscalationMessage();
    form.reset();
    return;
  }

  addMessage(
    `From ${answer.documentTitle} (page ${answer.pageNumber}): “${answer.quote}”`,
    'RulesChat'
  );

  form.reset();
});
