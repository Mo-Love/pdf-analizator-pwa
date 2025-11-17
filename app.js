const pdfInput = document.getElementById('pdfInput');
const fileNameEl = document.getElementById('fileName');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingText = document.getElementById('loadingText');
const analyzeBtn = document.getElementById('analyzeBtn');
const showFullTextBtn = document.getElementById('showFullTextBtn');
const fullTextContainer = document.getElementById('fullTextContainer');
const summaryEl = document.getElementById('summary');
const phrasesList = document.getElementById('phrasesList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const matchesList = document.getElementById('matchesList');

let extractedText = '';
let currentFile = null;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  currentFile = file;
  fileNameEl.textContent = file.name;
  analyzeBtn.disabled = true;
  showFullTextBtn.disabled = true;
  searchBtn.disabled = true;

  try{
    showLoading('Читаю PDF...');
    extractedText = await extractTextFromPDF(file);
    fullTextContainer.textContent = extractedText || '(Документ порожній або не вдалося витягнути текст)';
    showFullTextBtn.disabled = false;
    analyzeBtn.disabled = false;
    searchBtn.disabled = false;
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
    const analysis = await analyzeText(extractedText);
    renderAnalysis(analysis);
    hideLoading();
  } catch(err){
    console.error(err);
    hideLoading();
    alert('Помилка під час аналізу: ' + (err.message || err));
  }
});

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if(!query) return alert('Введіть хоча б одне ключове слово.');
  performSearch(query, extractedText);
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
  await new Promise(r=>setTimeout(r,800));
  const summary = text.split('\n').slice(0,5).join(' ').slice(0,700) + '...';
  const phrases = extractKeyPhrases(text).slice(0,10);
  return { summary, phrases };
}

function extractKeyPhrases(text){
  const words = text.toLowerCase().replace(/[^a-zа-яёіїєґ0-9\s]+/gi,' ').split(/\s+/).filter(Boolean);
  const freq = {};
  for(const w of words){ if(w.length>3) freq[w] = (freq[w]||0)+1; }
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,25);
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

/* Пошук та підсвітка */
function performSearch(query, text){
  const words = query.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if(words.length === 0) return;

  let displayText = text;
  const counts = {};

  words.forEach(word=>{
    const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
    counts[word] = (displayText.match(regex) || []).length;
    displayText = displayText.replace(regex, '<span class="highlight">$1</span>');
  });

  fullTextContainer.innerHTML = displayText;
  fullTextContainer.style.display = 'block';
  fullTextContainer.setAttribute('aria-hidden', 'false');

  matchesList.innerHTML = '';
  for(const [word,count] of Object.entries(counts)){
    const li = document.createElement('li');
    li.textContent = `"${word}": ${count} співпадінь`;
    matchesList.appendChild(li);
  }
  searchResults.style.display = 'block';
}

function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* Service Worker */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js')
    .then(()=>console.log('Service Worker registered'))
    .catch(err=>console.warn('SW register failed', err));
}
