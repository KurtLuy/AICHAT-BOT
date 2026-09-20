/* ============================================================
SPOT AI Parking Assistant
   ============================================================ */

const chatArea = document.getElementById('chatArea');
const quickOptions = document.getElementById('quickOptions');
const quickLabel = document.getElementById('quickLabel');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// ---- Conversation state ----
let state = { node: 'MAIN_MENU', pending: null, collected: {} };
let busy = false; // true while bot is "typing"

// ---- Menu tree definition ----
const NODES = {
  MAIN_MENU: {
    text: "Welcome to SPOT — Smart Parking Operations and Tracking System.\n\nHow can I help you today?",
    options: [
      { label: "I lost my parking ticket", next: "LOST_TICKET" },
      { label: "I have a reservation problem", next: "RESERVATION_MENU" },
      { label: "Someone parked in my slot", next: "SLOT_OCCUPIED" },
      { label: "Report Parking Facility Issue", next: "TECH_ISSUE" },
      { label: "Other concerns", next: "OTHER_CONCERNS" }
    ]
  },

  LOST_TICKET: {
    collect: [
      "Plate Number",
      "Vehicle Type (Car, Motorcycle, EV)",
      "Time of Entry"
    ],
    onComplete: (data) => {
      return "Thanks, here's what I have:\n" + formatCollected(data) +
        "\n\nOnce verified, please proceed to the Parking Management Office for identity verification.\n\nNote: A lost ticket fee may apply in accordance with parking policy.";
    },
    options: [
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  RESERVATION_MENU: {
    text: "Please select your concern:",
    options: [
      { label: "I arrived late", next: "RES_LATE" },
      { label: "I want to cancel my reservation", next: "RES_CANCEL" },
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  RES_LATE: {
    text: "According to SPOT policy, reserved parking slots are only held for 30 minutes after the scheduled reservation time.\n\nIf you arrive after 30 minutes, your reservation is automatically cancelled and the reservation down payment is non-refundable.",
    options: [
      { label: "Back to Reservation Menu", next: "RESERVATION_MENU" },
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  RES_CANCEL: {
    text: "Please note:\n\nReservation down payments are non-refundable once the reservation has been confirmed.\n\nYour parking slot will be released after cancellation.",
    options: [
      { label: "Do you want to proceed?", next: "RES_CONFIRM_CANCEL" },
      { label: "Back to Reservation Menu", next: "RESERVATION_MENU" },
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  RES_CONFIRM_CANCEL: {
    text: "Your reservation cancellation request has been processed. Your parking slot has been released.",
    options: [
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  SLOT_OCCUPIED: {
    collect: [
      "Assigned Slot Number:",
      "Unauthorized Vehicle Plate Number",
      "Vehicle Type (Car, Motorcycle, EV)"
    ],
    onComplete: (data) => {
      return "Alert Dispatched:\n\n" + formatCollected(data) +
        "\n\n- Attendants notified\n- Driver alerted to move vehicle\n\nThanks for reporting. We will notify our attendant and the unauthorized owner to move to their designated parking slot immediately.";
    },
    options: [
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  OTHER_CONCERNS: {
    text: "Please describe your concern below.",
    freeText: true,
    onFreeText: (text) => {
      return "Please immediately report this to the Parking Office. Our staff may review CCTV footage or provide further assistance if needed.";
    },
    options: [
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  },

  TECH_ISSUE: {
    text: "Please describe the technical issue you're experiencing.",
    freeText: true,
    onFreeText: (text) => {
      return "Thank you for reporting this. We've logged your report.";
    },
    options: [
      { label: "Back to Main Menu", next: "MAIN_MENU" }
    ]
  }
};

// ---- Helpers ----
function formatCollected(data) {
  return Object.entries(data).map(([k, v]) => `- ${k}: ${v}`).join("\n");
}

function addMessage(text, from) {
  const row = document.createElement('div');
  row.className = 'msg-row ' + (from === 'user' ? 'user' : 'bot');

  const avatar = document.createElement('div');
  avatar.className = 'avatar' + (from === 'user' ? ' user' : '');

  if (from === 'bot') {
    const img = document.createElement('img');
    img.src = 'Screenshot 2026-08-01 172429 (2).png';
    img.alt = 'Bot Avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    avatar.appendChild(img);
  } else {
    avatar.textContent = '';
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatArea.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addFormMessage(fields, onFormSubmit) {
  const row = document.createElement('div');
  row.className = 'msg-row bot';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const img = document.createElement('img');
  img.src = 'Screenshot 2026-08-01 172429 (2).png';
  img.alt = 'Bot Avatar';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.borderRadius = '50%';
  img.style.objectFit = 'cover';
  avatar.appendChild(img);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const title = document.createElement('div');
  title.textContent = "Please fill out this form:";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  bubble.appendChild(title);

  const inputs = {};

  fields.forEach(field => {
    const cleanField = field.replace(/:$/, '');
    const fieldContainer = document.createElement('div');
    fieldContainer.style.marginBottom = "14px";
    fieldContainer.style.position = "relative";

    const label = document.createElement('label');
    label.textContent = cleanField + ": ";
    label.style.display = "block";
    label.style.fontSize = "13px";
    label.style.marginBottom = "2px";

    const input = document.createElement('input');
    input.type = "text";
    input.style.width = "100%";
    input.style.padding = "6px 8px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "4px";
    input.style.fontSize = "13px";
    input.style.boxSizing = "border-box";

    const errorTooltip = document.createElement('div');
    errorTooltip.textContent = " Please fill out this field.";
    errorTooltip.style.display = "none";
    errorTooltip.style.position = "absolute";
    errorTooltip.style.bottom = "-26px";
    errorTooltip.style.left = "0";
    errorTooltip.style.backgroundColor = "#ffffff";
    errorTooltip.style.color = "#222";
    errorTooltip.style.fontSize = "12px";
    errorTooltip.style.padding = "3px 8px";
    errorTooltip.style.border = "1px solid #d9d9d9";
    errorTooltip.style.borderRadius = "3px";
    errorTooltip.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    errorTooltip.style.zIndex = "10";
    errorTooltip.style.whiteSpace = "nowrap";

    const warningIcon = document.createElement('span');
    warningIcon.textContent = "!";
    warningIcon.style.display = "inline-block";
    warningIcon.style.backgroundColor = "#f05a28";
    warningIcon.style.color = "#fff";
    warningIcon.style.fontWeight = "bold";
    warningIcon.style.borderRadius = "2px";
    warningIcon.style.padding = "0 5px";
    warningIcon.style.marginRight = "5px";
    warningIcon.style.fontSize = "11px";
    errorTooltip.prepend(warningIcon);

    input.addEventListener('input', () => {
      errorTooltip.style.display = "none";
      input.style.borderColor = "#ccc";
    });

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    fieldContainer.appendChild(errorTooltip);
    bubble.appendChild(fieldContainer);

    inputs[cleanField] = { inputEl: input, errorEl: errorTooltip };
  });

  const submitBtn = document.createElement('button');
  submitBtn.textContent = "Submit";
  submitBtn.style.marginTop = "6px";
  submitBtn.style.padding = "6px 12px";
  submitBtn.style.backgroundColor = "#4a7fd6";
  submitBtn.style.color = "#fff";
  submitBtn.style.border = "none";
  submitBtn.style.borderRadius = "4px";
  submitBtn.style.cursor = "pointer";
  submitBtn.style.fontWeight = "bold";

  const validateAndSubmit = () => {
    let hasError = false;
    const formData = {};

    for (const [key, { inputEl, errorEl }] of Object.entries(inputs)) {
      if (!inputEl.value.trim()) {
        errorEl.style.display = "block";
        inputEl.style.borderColor = "#f05a28";
        if (!hasError) inputEl.focus();
        hasError = true;
      } else {
        errorEl.style.display = "none";
        inputEl.style.borderColor = "#ccc";
        formData[key] = inputEl.value.trim();
      }
    }

    if (hasError) return false;

    for (const { inputEl } of Object.values(inputs)) {
      inputEl.disabled = true;
    }
    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = "#aaa";
    onFormSubmit(formData);
    return true;
  };

  submitBtn.onclick = validateAndSubmit;

  bubble.appendChild(submitBtn);

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatArea.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (state.pending) {
    state.pending.validate = validateAndSubmit;
  }
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typingRow';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';

  const img = document.createElement('img');
  img.src = 'Screenshot 2026-08-01 172429 (2).png';
  img.alt = 'Bot Avatar';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.borderRadius = '50%';
  img.style.objectFit = 'cover';
  avatar.appendChild(img);

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatArea.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  const row = document.getElementById('typingRow');
  if (row) row.remove();
}

function botReply(text, delay = 800) {
  busy = true;
  setInputEnabled(false);
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(text, 'bot');
    busy = false;
    setInputEnabled(true);
  }, delay);
}

function botReplyForm(fields, delay = 800) {
  busy = true;
  setInputEnabled(false);
  showTyping();
  setTimeout(() => {
    hideTyping();
    addFormMessage(fields, (formData) => {
      const node = NODES[state.node];
      state.collected = formData;
      const userSummary = Object.entries(formData).map(([k, v]) => `${k}: ${v}`).join('\n');
      addMessage(userSummary, 'user');

      const reply = node.onComplete ? node.onComplete(state.collected) : "Thank you, your information has been received.";
      botReply(reply, 800);
      state.pending = null;
    });
    busy = false;
    setInputEnabled(true);
  }, delay);
}

function setInputEnabled(enabled) {
  userInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
  if (enabled) userInput.focus();
}

function renderQuickOptions(node) {
  quickOptions.innerHTML = '';
  if (node.options && node.options.length) {
    quickLabel.textContent = "Please select an issue";
    node.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = `[${opt.label}]`;
      btn.onclick = () => { if (!busy) handleOptionClick(opt); };
      quickOptions.appendChild(btn);
    });
  } else {
    quickLabel.textContent = "";
  }
}

function goToNode(key) {
  state.node = key;
  state.pending = null;
  state.collected = {};
  const node = NODES[key];

  if (node.collect && node.collect.length) {
    state.pending = { fields: node.collect };
    botReplyForm(node.collect, 700);
  } else if (node.text) {
    botReply(node.text, 700);
  }

  renderQuickOptions(node);
}

function handleOptionClick(opt) {
  addMessage(opt.label, 'user');
  if (opt.next) {
    goToNode(opt.next);
  }
}

function handleUserText(text) {
  addMessage(text, 'user');

  if (state.pending && typeof state.pending.validate === 'function') {
    const isValid = state.pending.validate();
    if (!isValid) {
      botReply("Please fill out all required fields in the form above and click Submit.", 700);
      return;
    }
  }

  const node = NODES[state.node];

  if (node.freeText) {
    const reply = node.onFreeText ? node.onFreeText(text) : "Thanks, we've noted your concern.";
    botReply(reply, 900);
    return;
  }

  botReply("I'm sorry, I didn't understand your request.\n\nPlease choose one of the available options below.", 700);
  state.node = 'MAIN_MENU';
  renderQuickOptions(NODES.MAIN_MENU);
}

// ---- Input wiring ----
sendBtn.addEventListener('click', submitInput);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitInput();
  }
});

function submitInput() {
  if (busy) return;
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  handleUserText(text);
}

// ---- Init ----
function init() {
  const node = NODES.MAIN_MENU;
  botReply(node.text, 600);
  renderQuickOptions(node);
}

init();