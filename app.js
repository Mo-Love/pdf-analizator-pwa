/* app.js */
const pdfInput = document.getElementById('pdfInput');
const fileNameEl = document.getElementById('fileName');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingText = document.getElementById('loadingText');
const analyzeBtn = document.getElementById('analyzeBtn');
const showFullTextBtn = document.getElementById('showFullTextBtn');
const fullTextContainer = document.getElementById('fullTextContainer');
const summaryEl = document.getElementById('summary');
const phrasesList = document.getElementById('phrasesList');

let extractedText = '';
let currentFile = null;

/* PDF.js worker (CDN) */
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  currentFile = file;
  fileNameEl.textContent = file.name;
  analyzeBtn.disabled = true;
  showFullTextBtn.disabled = true;

  try{
    showLoading('Читаю PDF...');
    extractedText = await extractTextFromPDF(file);
    fullTextContainer.textContent = extractedText || '(Документ порожній або не вдалося витягнути текст)';
    showFullTextBtn.disabled = false;
    analyzeBtn.disabled = false;
    hideLoading();
  } catch(err){
    console.error(err);
    hideLoading();
    alert('Помилка при читанні PDF: ' + (err.message || err));
  }
});

showFullTextBtn.addEventListener('click', () => {
  const visible = fullTextContainer.style.display === 'block';
  fullTextContainer.style.display = visible ? 'none' : 'block';
  fullTextContainer.setAttribute('aria-hidden', visible ? 'true' : 'false');
});

analyzeBtn.addEventListener('click', async () => {
  if(!extractedText) return alert('Спочатку завантажте PDF та дочекайтеся витягнення тексту.');
  try{
    showLoading('Аналізую текст...');
    // TODO: підключити реальний LLM / бекенд
    const analysis = await analyzeText(extractedText);
    renderAnalysis(analysis);
    hideLoading();
  } catch(err){
    console.error(err);
    hideLoading();
    alert('Помилка під час аналізу: ' + (err.message || err));
  }
});

function showLoading(text='Завантаження...'){
  loadingText.textContent = text;
  loadingIndicator.style.display = 'flex';
}
function hideLoading(){ loadingIndicator.style.display = 'none'; }

async function extractTextFromPDF(file){
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
  const pdf = await loadingTask.promise;
  let text = '';
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n\n';
  }
  return text.trim();
}

async function analyzeText(text){
  // Поки що локальний псевдо-аналіз (замінити на реальний виклик API)
  await new Promise(r=>setTimeout(r,800));
  const summary = text.split('\n').slice(0,5).join(' ').slice(0,700) + '...';
  const phrases = extractKeyPhrases(text).slice(0,10);
  return { summary, phrases };
}

function extractKeyPhrases(text){
  const words = text.toLowerCase().replace(/[^a-zа-яёіїєґ0-9\s]+/gi,' ').split(/\s+/).filter(Boolean);
  const freq = {};
  for(const w of words){ if(w.length>3) freq[w] = (freq[w]||0)+1; }
  const arr = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  return arr.slice(0,25);
}

function renderAnalysis({summary, phrases}){
  summaryEl.textContent = summary;
  phrasesList.textContent = (phrases && phrases.length) ? phrases.join(', ') : '-';
}

/* Аккордеон */
const accBtn = document.querySelector('.accordion-btn');
if(accBtn){
  accBtn.addEventListener('click', ()=>{
    const content = document.querySelector('.accordion-content');
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
}

/* Install prompt handler (зберігаємо для кастомної кнопки за потреби) */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

/* Service worker: відносний шлях! */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js')
    .then(()=>console.log('Service Worker registered'))
    .catch(err=>console.warn('SW register failed', err));
}
