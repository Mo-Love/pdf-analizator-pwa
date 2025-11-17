// app.js — логіка фронтенду
// читаємо файл у ArrayBuffer
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
// TODO: заміни цей псевдо-аналіз викликом до реальної LLM або локальної моделі
// Приклад: відправити POST /api/analyze { text }


// Штучний аналіз для прикладу
await new Promise(r=>setTimeout(r,800));
const summary = text.split('\n').slice(0,5).join(' ').slice(0,600) + '...';
const phrases = extractKeyPhrases(text).slice(0,10);
return { summary, phrases };
}


function extractKeyPhrases(text){
// Проста евристика: шукаємо слова/короткі фрази що часто повторюються
const words = text.toLowerCase().replace(/[^a-zа-яёіїєґ0-9\s]+/gi,' ').split(/\s+/).filter(Boolean);
const freq = {};
for(const w of words){ if(w.length>3) freq[w] = (freq[w]||0)+1; }
const arr = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
return arr.slice(0,25);
}


function renderAnalysis({summary, phrases}){
summaryEl.textContent = summary;
phrasesList.textContent = phrases.join(', ') || '-';
}


// Аккордеон інструкції
const accBtn = document.querySelector('.accordion-btn');
if(accBtn){
accBtn.addEventListener('click', ()=>{
const content = document.querySelector('.accordion-content');
content.style.display = content.style.display === 'block' ? 'none' : 'block';
});
}


// Підтримка PWA install prompt (встановлення)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
e.preventDefault();
deferredPrompt = e; // можна зберегти і викликати тоді коли треба
// можна показати власну кнопку для встановлення
});


// Реєстрація service worker
if('serviceWorker' in navigator){
navigator.serviceWorker.register('/sw.js').then(()=>console.log('SW registered')).catch(console.error);
}
