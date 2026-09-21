const questions = [
  {key:'firstName',label:'What is your first name?',type:'text',hint:'e.g. Alex',category:'ABOUT YOU'},
  {key:'lastName',label:'What is your last name?',type:'text',hint:'e.g. Morgan',category:'ABOUT YOU'},
  {key:'email',label:'What is your email address?',type:'email',hint:'alex@example.com',category:'ABOUT YOU'},
  {key:'phone',label:'What is your phone number?',type:'tel',hint:'+1 415 555 0182',category:'ABOUT YOU'},
  {key:'city',label:'Which city do you live in?',type:'text',hint:'e.g. San Francisco',category:'ABOUT YOU'},
  {key:'country',label:'Which country or region?',type:'text',hint:'e.g. United States',category:'ABOUT YOU'},
  {key:'timeZone',label:'What is your time zone?',type:'choice',options:['UTC−8 / Pacific','UTC−5 / Eastern','UTC+0 / London','UTC+8 / Singapore'],category:'ABOUT YOU'},
  {key:'contactMethod',label:'How should we contact you?',type:'choice',options:['Email','Phone','Either'],category:'ABOUT YOU'},
  {key:'website',label:'What is your website or profile URL?',type:'url',hint:'https://example.com',category:'ABOUT YOU'},
  {key:'intro',label:'Introduce yourself in one sentence.',type:'textarea',hint:'A short sentence is enough.',category:'ABOUT YOU'},

  {key:'organization',label:'Where do you work?',type:'text',hint:'e.g. Northstar Studio',category:'YOUR WORK'},
  {key:'jobTitle',label:'What is your job title?',type:'text',hint:'e.g. Product Designer',category:'YOUR WORK'},
  {key:'industry',label:'Which industry are you in?',type:'choice',options:['Technology','Education','Healthcare','Finance','Retail','Other'],category:'YOUR WORK'},
  {key:'teamSize',label:'How large is your team?',type:'choice',options:['Just me','2–10 people','11–50 people','51–200 people','200+ people'],category:'YOUR WORK'},
  {key:'experience',label:'How many years of experience?',type:'choice',options:['Less than 1 year','1–3 years','4–7 years','8+ years'],category:'YOUR WORK'},
  {key:'workLocation',label:'Where do you usually work?',type:'choice',options:['Remote','Hybrid','On-site'],category:'YOUR WORK'},
  {key:'primaryTool',label:'What work tool do you use most?',type:'text',hint:'e.g. Google Workspace',category:'YOUR WORK'},
  {key:'weeklyHours',label:'Hours of repetitive work each week?',type:'choice',options:['Less than 2','2–5','6–10','More than 10'],category:'YOUR WORK'},
  {key:'mainTask',label:'What task do you repeat most?',type:'textarea',hint:'Describe it briefly.',category:'YOUR WORK'},
  {key:'automationGoal',label:'What would you automate first?',type:'textarea',hint:'One task is enough.',category:'YOUR WORK'},

  {key:'learningStyle',label:'How do you prefer to learn?',type:'choice',options:['Hands-on','Written guide','Video'],category:'PREFERENCES'},
  {key:'updateFrequency',label:'How often do you want updates?',type:'choice',options:['Daily','Weekly','Monthly','Only when needed'],category:'PREFERENCES'},
  {key:'device',label:'What is your main device?',type:'choice',options:['Laptop','Desktop','Tablet'],category:'PREFERENCES'},
  {key:'browser',label:'Which browser do you prefer?',type:'choice',options:['Chrome','Safari','Edge','Firefox','Other'],category:'PREFERENCES'},
  {key:'priority',label:'What matters most to you?',type:'choice',options:['Speed','Accuracy','Simplicity','Flexibility'],category:'PREFERENCES'},
  {key:'collaboration',label:'How do you like to collaborate?',type:'choice',options:['Work alone','Small team','Large team'],category:'PREFERENCES'},
  {key:'startWhen',label:'When would you start using automation?',type:'choice',options:['This week','This month','Later this year','Just exploring'],category:'PREFERENCES'},
  {key:'useCase',label:'Which use case feels most useful?',type:'text',hint:'e.g. Filling forms',category:'PREFERENCES'},
  {key:'successMetric',label:'What would success look like?',type:'textarea',hint:'Describe a result you would notice.',category:'PREFERENCES'},
  {key:'additionalNotes',label:'Anything else you would like to share?',type:'textarea',hint:'A short final note is enough.',category:'PREFERENCES'}
];

const values = Object.create(null);
let current = 0;
let submitted = false;
let choiceAdvanceTimer = null;
const CHOICE_FEEDBACK_MS = 220;
const $ = id => document.getElementById(id);
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const filled = () => questions.filter(q => String(values[q.key] || '').trim()).length;

function render() {
  if (choiceAdvanceTimer !== null) {
    clearTimeout(choiceAdvanceTimer);
    choiceAdvanceTimer = null;
  }
  const q = questions[current];
  $('step-counter').innerHTML = `${String(current + 1).padStart(2,'0')} <span>/ 30</span>`;
  $('progress-fill').style.width = `${filled() / 30 * 100}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(filled()));
  $('category').textContent = q.category;
  $('field-type').textContent = q.type === 'choice' || q.type === 'select' ? 'SELECT ONE' : q.type === 'textarea' ? 'LONG ANSWER' : 'SHORT ANSWER';
  $('question-label').textContent = q.label;
  $('question-help').textContent = q.type === 'choice' ? 'Choose one option to continue.' : q.type === 'select' ? 'Choose one option from the menu.' : 'You can use synthetic details for this demo.';
  $('form-error').hidden = true;
  $('back-button').disabled = current === 0;
  $('next-button').disabled = false;
  $('next-button').innerHTML = current === 29 ? 'SUBMIT <span aria-hidden="true">↗</span>' : 'OK <span aria-hidden="true">↗</span>';
  document.querySelectorAll('[data-section-dot]').forEach((dot,i) => {
    dot.classList.toggle('active', Math.floor(current / 10) === i);
    dot.classList.toggle('complete', Math.floor(current / 10) > i);
  });
  const value = values[q.key] || '';
  if (q.type === 'choice') {
    $('answer-host').innerHTML = `<fieldset class="choice-grid" aria-label="${escapeHtml(q.label)}">${q.options.map((option,i) => `<label class="choice-option"><input id="${i === 0 ? 'answer-input' : 'answer-option-'+i}" type="radio" name="${q.key}" value="${escapeHtml(option)}" ${value === option ? 'checked' : ''}><span>${escapeHtml(option)}</span></label>`).join('')}</fieldset>`;
  } else if (q.type === 'select') {
    $('answer-host').innerHTML = `<select class="answer-control" id="answer-input" name="${q.key}"><option value="">Choose an option</option>${q.options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  } else if (q.type === 'textarea') {
    $('answer-host').innerHTML = `<textarea class="answer-control" id="answer-input" name="${q.key}" placeholder="${escapeHtml(q.hint)}" rows="2">${escapeHtml(value)}</textarea>`;
  } else {
    $('answer-host').innerHTML = `<input class="answer-control" id="answer-input" name="${q.key}" type="${q.type}" placeholder="${escapeHtml(q.hint)}" value="${escapeHtml(value)}" autocomplete="off">`;
  }
  window.scrollTo({top:0,behavior:'instant'});
  if (q.type !== 'choice') $('answer-input').focus({preventScroll:true});
}

function syncAnswer(event) {
  if (event.target.name !== questions[current].key) return;
  values[event.target.name] = event.target.value;
  $('form-error').hidden = true;
  if (event.target.classList) event.target.classList.remove('invalid');
  $('progress-fill').style.width = `${filled() / 30 * 100}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(filled()));
}

function advance() {
  const q = questions[current];
  // Native Accessibility value-setting may change a browser control without
  // dispatching an input event. Read the visible control at the commit point,
  // so keyboard users and AX clients follow the same validation path.
  const control = q.type === 'choice'
    ? document.querySelector(`[name="${q.key}"]:checked`)
    : document.querySelector(`[name="${q.key}"]`);
  const answer = String(control?.value || values[q.key] || '').trim();
  if (answer) values[q.key] = answer;
  if (!answer) {
    $('form-error').textContent = 'Please answer this question to continue.';
    $('form-error').hidden = false;
    $('answer-input')?.focus();
    return false;
  }
  if ((q.type === 'email' || q.type === 'url') && !control.checkValidity()) {
    $('form-error').textContent = q.type === 'email' ? 'Please enter a valid email address.' : 'Please enter a full URL, including https://';
    $('form-error').hidden = false;
    control.classList.add('invalid'); control.focus();
    return false;
  }
  if (current < questions.length - 1) { current++; render(); return true; }
  submitted = true;
  $('question-view').hidden = true;
  $('success-view').hidden = false;
  $('step-counter').innerHTML = '30 <span>/ 30</span>';
  $('progress-fill').style.width = '100%';
  document.querySelector('.progress-track').setAttribute('aria-valuenow','30');
  $('receipt-code').textContent = `VL-${Date.now().toString(36).toUpperCase()}`;
  $('back-button').disabled = true;
  return true;
}

$('answer-host').addEventListener('input', syncAnswer);
$('answer-host').addEventListener('change', event => {
  syncAnswer(event);
  if (event.target.type === 'radio') {
    if (choiceAdvanceTimer !== null) return;
    const selected = event.target.closest('.choice-option');
    selected?.classList.add('is-confirming');
    $('next-button').disabled = true;
    $('back-button').disabled = true;
    choiceAdvanceTimer = setTimeout(() => {
      choiceAdvanceTimer = null;
      advance();
    }, CHOICE_FEEDBACK_MS);
  } else if (event.target.tagName === 'SELECT') {
    advance();
  }
});
$('question-form').addEventListener('submit', event => {
  event.preventDefault();
  if (choiceAdvanceTimer === null) advance();
});
$('question-form').addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.tagName === 'TEXTAREA' && !event.shiftKey) {
    event.preventDefault(); advance();
  }
});
$('back-button').addEventListener('click', () => {if (current > 0 && !submitted) {current--;render();}});
$('restart-button').addEventListener('click', () => {
  questions.forEach(q => delete values[q.key]);
  current = 0; submitted = false;
  $('question-view').hidden = false; $('success-view').hidden = true;
  render();
});
render();

// Structured equivalents of the visible actions, for browsers with WebMCP.
// The Violoop/Jev acceptance run uses the actual browser UI instead.
if (document.modelContext?.registerTool) {
  const register = tool => {try {Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {});} catch {}};
  register({name:'read_profile_question',title:'Read current question',description:'Read the visible question and current progress without changing the form.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:() => ({number:current+1,total:30,question:questions[current].label,key:questions[current].key,type:questions[current].type,options:questions[current].options||null,answer:values[questions[current].key]||'',submitted})});
  register({name:'answer_profile_question',title:'Answer current question',description:'Set the answer for the currently visible question without advancing.',inputSchema:{type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({answer}) => {
    if (submitted || typeof answer !== 'string') throw new Error('Form is not accepting this answer');
    const q = questions[current];
    if (q.options && !q.options.includes(answer)) throw new Error('Answer is not one of the visible options');
    values[q.key] = answer;
    render();
    return {number:current+1,answer:values[q.key]};
  }});
  register({name:'continue_profile_form',title:'Continue profile form',description:'Validate the visible answer and advance one question, or complete the form after question 30.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:() => {
    if (!advance()) throw new Error($('form-error').textContent);
    return {number:submitted ? 30 : current+1,total:30,submitted,reference:submitted ? $('receipt-code').textContent : null};
  }});
}
