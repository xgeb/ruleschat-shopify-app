const config = {
  widgetTitle: 'RulesChat',
  widgetEyebrow: 'League Rules',
  widgetNotice: 'Answers are based only on the posted rule documents.',
  documents: [
    { title: 'Core Rulebook', url: '' },
    { title: 'Safety Manual', url: '' },
    { title: 'Weapon Specs', url: '' },
    { title: 'Armor Guide', url: '' },
    { title: 'Event Policies', url: '' },
    { title: 'Referee Notes', url: '' },
    { title: 'Supplement A', url: '' },
    { title: 'Supplement B', url: '' },
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

    fields.append(nameField, urlField);
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

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    return;
  }

  addMessage(value, 'You');
  addMessage(
    'Thanks! This prototype will provide document-grounded answers in Milestone 2.',
    'RulesChat'
  );

  form.reset();
});
