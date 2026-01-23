import { CreateMLCEngine } from 'https://esm.sh/@mlc-ai/web-llm@0.2.52';
import { chunkText, retrieveRelevantChunks } from './widget-utils.js';

const config = {
  widgetTitle: 'RulesChat',
  widgetEyebrow: 'League Rules',
  widgetNotice: 'Answers are based only on the posted rule documents.',
  themeColor: '#3b82f6',
  planTier: 'starter',
  maxDocuments: 8,
  documents: [
    { title: 'Core Rulebook', url: '', file: null, chunks: [], section: '' },
    { title: 'Safety Manual', url: '', file: null, chunks: [], section: '' },
    { title: 'Weapon Specs', url: '', file: null, chunks: [], section: '' },
    { title: 'Armor Guide', url: '', file: null, chunks: [], section: '' },
    { title: 'Event Policies', url: '', file: null, chunks: [], section: '' },
    { title: 'Referee Notes', url: '', file: null, chunks: [], section: '' },
    { title: 'Supplement A', url: '', file: null, chunks: [], section: '' },
    { title: 'Supplement B', url: '', file: null, chunks: [], section: '' },
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
const modelStatusNode = document.querySelector('[data-model-status]');
const modelDetailNode = document.querySelector('[data-model-detail]');
const modelActionButton = document.querySelector('[data-model-action]');
const rootStyle = document.documentElement.style;
const planNameNode = document.querySelector('[data-plan-name]');
const planLimitNode = document.querySelector('[data-plan-limit]');
const planUsageNode = document.querySelector('[data-plan-usage]');
const planUpsellNode = document.querySelector('[data-plan-upsell]');
const upgradeProButton = document.querySelector('[data-upgrade-pro]');
const upgradePowerButton = document.querySelector('[data-upgrade-power]');
const charCountNode = document.querySelector('[data-char-count]');

const THEME_PRESETS = new Map([
  ['Red', '#ef4444'],
  ['Orange', '#f97316'],
  ['Yellow', '#eab308'],
  ['Green-Yellow', '#84cc16'],
  ['Green', '#22c55e'],
  ['Green-Blue', '#14b8a6'],
  ['Blue', '#3b82f6'],
  ['Purple-Blue', '#6366f1'],
  ['Purple', '#a855f7'],
  ['Red-Purple', '#ec4899'],
  ['Black', '#111827'],
  ['Gray', '#6b7280'],
]);

const PLAN_DEFINITIONS = {
  starter: { name: 'Starter', price: '$9/month', maxDocuments: 8 },
  pro: { name: 'Pro', price: '$15/month', maxDocuments: 28 },
  power: { name: 'Power', price: '$20/month', maxDocuments: 75 },
};

const MODEL_NAME = 'Llama-3.2-1B-Instruct-q4f16_1';
const MAX_CONTEXT_CHUNKS = 3;
const MAX_INPUT_LENGTH = 250;

let llmEngine = null;
let modelLoading = false;
let modelReady = false;
let modelError = null;

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
  if (label === 'RulesChat') {
    message.classList.add('message--assistant');
  }

  const messageLabel = document.createElement('p');
  messageLabel.className = 'message__label';
  messageLabel.textContent = label;

  const messageBody = document.createElement('p');
  messageBody.textContent = content;

  message.append(messageLabel, messageBody);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
};

const setModelStatus = (status, detail = '') => {
  if (modelStatusNode) {
    modelStatusNode.textContent = status;
  }
  if (modelDetailNode) {
    modelDetailNode.textContent = detail;
  }
};

const setModelAction = (label, onClick, disabled = false) => {
  if (!modelActionButton) {
    return;
  }
  modelActionButton.textContent = label;
  modelActionButton.disabled = disabled;
  modelActionButton.onclick = onClick;
};

const setComposerEnabled = (enabled) => {
  if (!form || !input) {
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  input.disabled = !enabled;
  if (submitButton) {
    submitButton.disabled = !enabled;
  }
};

const isWebGpuAvailable = () => Boolean(navigator.gpu);

const createEmptyDocument = () => ({
  title: "",
  url: "",
  file: null,
  chunks: [],
  section: "",
});

const getDocumentUsageCount = () =>
  config.documents.filter((doc) => doc.url || doc.file).length;

const getSectionName = (doc) => doc.section?.trim() || 'Unassigned';

const groupDocumentsBySection = (documents) => {
  const grouped = new Map();
  documents.forEach((doc, index) => {
    const name = getSectionName(doc);
    if (!grouped.has(name)) {
      grouped.set(name, []);
    }
    grouped.get(name).push({ doc, index });
  });
  return grouped;
};

const ensureDocumentSlots = () => {
  while (config.documents.length < config.maxDocuments) {
    config.documents.push(createEmptyDocument());
  }
  if (config.documents.length > config.maxDocuments) {
    config.documents.length = config.maxDocuments;
  }
};

const updatePlanUI = () => {
  const plan = PLAN_DEFINITIONS[config.planTier];
  if (!plan) {
    return;
  }
  config.maxDocuments = plan.maxDocuments;
  ensureDocumentSlots();
  const usageCount = getDocumentUsageCount();

  if (planNameNode) {
    planNameNode.textContent = plan.name;
  }
  if (planLimitNode) {
    planLimitNode.textContent = plan.maxDocuments;
  }
  if (planUsageNode) {
    planUsageNode.textContent = usageCount;
  }
  if (planUpsellNode) {
    const isAtLimit = usageCount >= plan.maxDocuments;
    planUpsellNode.classList.toggle('is-visible', isAtLimit);
  }
};

const updateCharCount = () => {
  if (!charCountNode || !input) {
    return;
  }
  const remaining = MAX_INPUT_LENGTH - (input.value?.length ?? 0);
  const isAtLimit = remaining <= 0;
  charCountNode.textContent = isAtLimit
    ? 'Character limit reached (250 max).'
    : '';
  charCountNode.classList.toggle('is-hidden', !isAtLimit);
  charCountNode.classList.toggle('is-warning', isAtLimit);
};

const formatProgressDetail = (report) => {
  if (!report) {
    return '';
  }
  const percent =
    typeof report.progress === 'number'
      ? `${Math.round(report.progress * 100)}%`
      : null;
  const text = report.text ? report.text.trim() : '';
  if (percent && text) {
    return `${percent} • ${text}`;
  }
  return percent || text;
};

const loadModel = async () => {
  if (modelReady || modelLoading) {
    return modelReady;
  }

  if (!isWebGpuAvailable()) {
    modelError = new Error('WebGPU is unavailable.');
    setModelStatus(
      'WebGPU is not available in this browser.',
      'Switch to a WebGPU-enabled browser to use local answers.'
    );
    setModelAction('WebGPU unavailable', () => {}, true);
    setComposerEnabled(false);
    return false;
  }

  modelLoading = true;
  modelError = null;
  setModelStatus('Loading model for local answers…');
  setModelAction('Loading…', () => {}, true);
  setComposerEnabled(false);

  try {
    llmEngine = await CreateMLCEngine(MODEL_NAME, {
      initProgressCallback: (report) => {
        const detail = formatProgressDetail(report);
        if (detail) {
          setModelStatus('Loading model for local answers…', detail);
        }
      },
    });
    modelReady = true;
    setModelStatus('Model ready for questions.');
    setModelAction('Reload model', () => {
      modelReady = false;
      llmEngine = null;
      loadModel();
    });
    setComposerEnabled(true);
    return true;
  } catch (error) {
    console.error(error);
    modelError = error;
    modelReady = false;
    llmEngine = null;
    setModelStatus(
      'Model failed to load.',
      'Check your connection and try again.'
    );
    setModelAction('Retry loading model', loadModel);
    setComposerEnabled(false);
    return false;
  } finally {
    modelLoading = false;
  }
};

const addEscalationMessage = () => {
  const message = document.createElement('article');
  message.className = 'message';

  const messageLabel = document.createElement('p');
  messageLabel.className = 'message__label';
  messageLabel.textContent = 'RulesChat';

  const messageBody = document.createElement('p');
  messageBody.textContent = 'I cannot find this in the posted documents.';

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
  if (!documentsList) {
    return;
  }

  documentsList.innerHTML = '';
  const groupedDocuments = groupDocumentsBySection(config.documents);

  groupedDocuments.forEach((entries, sectionName) => {
    const section = document.createElement('div');
    section.className = 'documents__section';

    const title = document.createElement('h3');
    title.className = 'documents__section-title';
    title.textContent = sectionName;

    const list = document.createElement('ul');
    list.className = 'documents__list';

    entries.forEach(({ doc, index }) => {
      const item = document.createElement('li');
      item.className = 'documents__item';

      const link = document.createElement('a');
      link.className = 'documents__link';
      link.href = doc.url || '#';
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.setAttribute(
        'aria-label',
        `Open ${doc.title || `Document ${index + 1}`} document`
      );

      const icon = document.createElement('span');
      icon.className = 'documents__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'PDF';

      const label = document.createElement('span');
      label.textContent = doc.title || `Document ${index + 1}`;

      link.append(icon, label);
      item.append(link);
      list.append(item);
    });

    section.append(title, list);
    documentsList.append(section);
  });
};

const renderAdminDocuments = () => {
  if (!adminDocuments) {
    return;
  }

  adminDocuments.innerHTML = '';
  const usageCount = getDocumentUsageCount();
  const limitReached = usageCount >= config.maxDocuments;
  const groupedDocuments = groupDocumentsBySection(config.documents);

  groupedDocuments.forEach((entries, sectionName) => {
    const section = document.createElement('section');
    section.className = 'admin__document-group';

    const groupTitle = document.createElement('p');
    groupTitle.className = 'admin__document-title';
    groupTitle.textContent = sectionName;

    const groupList = document.createElement('div');
    groupList.className = 'admin__document-group-list';

    entries.forEach(({ doc, index }) => {
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

      const sectionField = document.createElement('div');
      sectionField.className = 'admin__document-field';
      const sectionLabel = document.createElement('label');
      sectionLabel.textContent = 'Section name';
      const sectionInput = document.createElement('input');
      sectionInput.type = 'text';
      sectionInput.placeholder = 'e.g. Equipment rules';
      sectionInput.value = doc.section;
      sectionInput.addEventListener('input', (event) => {
        doc.section = event.target.value;
        renderDocuments();
        renderAdminDocuments();
      });
      sectionField.append(sectionLabel, sectionInput);

      const urlField = document.createElement('div');
      urlField.className = 'admin__document-field';
      const urlLabel = document.createElement('label');
      urlLabel.textContent = 'PDF URL (hosted)';
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.placeholder = 'https://example.com/rules.pdf';
      urlInput.value = doc.url;
      urlInput.disabled = limitReached && !doc.url && !doc.file;
      urlInput.addEventListener('input', (event) => {
        doc.url = event.target.value;
        updatePlanUI();
        renderDocuments();
        renderAdminDocuments();
      });
      urlField.append(urlLabel, urlInput);

      // Admin-only upload (browser session prototype)
      const fileField = document.createElement('div');
      fileField.className = 'admin__document-field';
      const fileLabel = document.createElement('label');
      fileLabel.textContent = 'Upload PDF';
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/pdf';
      fileInput.disabled = limitReached && !doc.url && !doc.file;

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
          updatePlanUI();
          renderAdminDocuments();
        } catch (error) {
          console.error(error);
          doc.file = null;
          doc.chunks = [];
          fileStatus.textContent =
            'Unable to process PDF. Please try another file.';
          updatePlanUI();
          renderAdminDocuments();
        }
      });

      fileField.append(fileLabel, fileInput, fileStatus);

      fields.append(nameField, sectionField, urlField, fileField);
      wrapper.append(title, fields);
      groupList.append(wrapper);
    });

    section.append(groupTitle, groupList);
    adminDocuments.append(section);
  });
};

const syncHeaderInputs = () => {
  const titleInput = document.querySelector('#admin-title-input');
  const eyebrowInput = document.querySelector('#admin-eyebrow-input');
  const noticeInput = document.querySelector('#admin-notice-input');
  const themeInput = document.querySelector('#admin-theme-input');
  const presetInput = document.querySelector('#admin-theme-preset');

  const setThemeColor = (value) => {
    if (!value) {
      return;
    }
    config.themeColor = value;
    rootStyle.setProperty('--theme-primary', value);
    if (themeInput) {
      themeInput.value = value;
    }
  };

  const syncPresetSelection = (value) => {
    if (!presetInput) {
      return;
    }
    const match = Array.from(THEME_PRESETS.values()).find(
      (preset) => preset.toLowerCase() === value.toLowerCase()
    );
    presetInput.value = match ?? 'custom';
  };

  if (titleInput) {
    titleInput.addEventListener('input', (event) => {
      config.widgetTitle = event.target.value;
      if (titleNode) {
        titleNode.textContent = config.widgetTitle;
      }
    });
  }

  if (eyebrowInput) {
    eyebrowInput.addEventListener('input', (event) => {
      config.widgetEyebrow = event.target.value;
      if (eyebrowNode) {
        eyebrowNode.textContent = config.widgetEyebrow;
      }
    });
  }

  if (noticeInput) {
    noticeInput.addEventListener('input', (event) => {
      config.widgetNotice = event.target.value;
      if (noticeNode) {
        noticeNode.textContent = config.widgetNotice;
      }
    });
  }

  if (themeInput) {
    themeInput.addEventListener('input', (event) => {
      setThemeColor(event.target.value);
      syncPresetSelection(event.target.value);
    });
  }

  if (presetInput) {
    presetInput.addEventListener('change', (event) => {
      const value = event.target.value;
      if (value === 'custom') {
        return;
      }
      setThemeColor(value);
    });
  }

  setThemeColor(config.themeColor);
  syncPresetSelection(config.themeColor);
};

const findAnswer = (question) => {
  const allChunks = config.documents.flatMap((doc) =>
    (doc.chunks ?? []).map((chunk) => ({
      ...chunk,
      documentTitle: doc.title,
    }))
  );

  const matches = retrieveRelevantChunks(question, allChunks);
  return matches.slice(0, MAX_CONTEXT_CHUNKS);
};

const buildPromptMessages = (question, matches) => {
  const sources = matches.map((match, index) => ({
    index: index + 1,
    documentTitle: match.documentTitle,
    pageNumber: match.pageNumber,
    quote: match.content,
  }));

  const sourcesText = sources
    .map(
      (source) =>
        `Source ${source.index}: ${source.documentTitle} (page ${source.pageNumber})\n“${source.quote}”`
    )
    .join('\n\n');

  return {
    messages: [
      {
        role: 'system',
        content:
          'You are RulesChat, a league rules assistant. Use only the provided sources to answer. If the answer is not in the sources, say you do not know and suggest contacting league staff. Keep the answer concise, friendly, and cite sources by document title and page.',
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nSources:\n${sourcesText}`,
      },
    ],
    sources,
  };
};

const formatSourcesFooter = (sources) => {
  const uniqueSources = new Map();
  sources.forEach((source) => {
    const key = `${source.documentTitle}-${source.pageNumber}`;
    if (!uniqueSources.has(key)) {
      uniqueSources.set(
        key,
        `${source.documentTitle} (page ${source.pageNumber})`
      );
    }
  });
  return `Sources: ${Array.from(uniqueSources.values()).join('; ')}`;
};

const generateAnswer = async (question, matches) => {
  if (!matches.length) {
    return null;
  }

  const modelLoaded = await loadModel();
  if (!modelLoaded || !llmEngine) {
    return null;
  }

  const { messages: promptMessages, sources } = buildPromptMessages(
    question,
    matches
  );

  const response = await llmEngine.chat.completions.create({
    messages: promptMessages,
    temperature: 0.2,
    max_tokens: 300,
  });

  const answer = response?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    return null;
  }

  return `${answer}\n\n${formatSourcesFooter(sources)}`;
};

syncHeaderInputs();
updatePlanUI();
renderDocuments();
renderAdminDocuments();
updateCharCount();

if (input) {
  input.addEventListener('input', updateCharCount);
}

if (modelActionButton) {
  setModelAction('Load model', loadModel);
}

if (!isWebGpuAvailable()) {
  setModelStatus(
    'WebGPU is not available in this browser.',
    'Switch to a WebGPU-enabled browser to use local answers.'
  );
  setModelAction('WebGPU unavailable', () => {}, true);
  setComposerEnabled(false);
}

if (upgradeProButton) {
  upgradeProButton.addEventListener('click', () => {
    config.planTier = 'pro';
    updatePlanUI();
    renderAdminDocuments();
    renderDocuments();
  });
}

if (upgradePowerButton) {
  upgradePowerButton.addEventListener('click', () => {
    config.planTier = 'power';
    updatePlanUI();
    renderAdminDocuments();
    renderDocuments();
  });
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = input?.value?.trim() ?? '';

    if (!value) {
      return;
    }

    addMessage(value, 'You');

    const matches = findAnswer(value);

    if (!matches.length) {
      addEscalationMessage();
      form.reset();
      updateCharCount();
      return;
    }

    addMessage('Let me check the rule documents…', 'RulesChat');

    try {
      const response = await generateAnswer(value, matches);
      if (!response) {
        addEscalationMessage();
        form.reset();
        updateCharCount();
        return;
      }
      addMessage(response, 'RulesChat');
    } catch (error) {
      console.error(error);
      addMessage(
        'I ran into a problem generating that answer. Please try again.',
        'RulesChat'
      );
    }

    form.reset();
    updateCharCount();
  });
}
