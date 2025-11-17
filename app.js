let llm = null;
let pdfText = '';

async function initLLM() {
  const loading = document.getElementById('loading');
  loading.classList.remove('hidden');
  loading.innerHTML = '<div class="spinner"></div>Завантажую модель LLM...';

  try {
    const selectedModel = await webllm.GetWebLLMModel('Gemma-2B-2bit');
    llm = await selectedModel.create();
    loading.innerHTML = '<div class="spinner"></div>Модель готова!';
    setTimeout(() => loading.classList.add('hidden'), 1000);
  } catch (error) {
    console.error('LLM error:', error);
    loading.innerHTML = 'Fallback-режим (базовий аналіз без AI)';
    setTimeout(() => loading.classList.add('hidden'), 2000);
    llm = null;
  }
}

async function analyzePDF() {
  const fileInput = document.getElementById('pdfInput');
  const file = fileInput.files[0];
  if (!file) {
    fileInput.classList.add('error-shake');  // Анімація для помилки
    setTimeout(() => fileInput.classList.remove('error-shake'), 500);
    return alert('Обери PDF!');
  }

  const loading = document.getElementById('loading');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const result = document.getElementById('result');
  loading.classList.remove('hidden');
  progressBar.classList.remove('hidden');
  loading.innerHTML = '<div class="spinner"></div>Парсю PDF...';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pdfText = '';
    const totalPages = pdf.numPages;
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      pdfText += textContent.items.map(item => item.str).join(' ') + '\n--- Сторінка ' + i + ' ---\n';
      
      // Прогрес з анімацією
      const progress = (i / totalPages) * 100;
      progressFill.style.width = progress + '%';
      loading.innerHTML = `<div class="spinner"></div>Обробляю сторінку ${i}/${totalPages}...`;
    }

    const keywords = document.getElementById('keywordsInput').value;

    // Спрощення тексту
    let simplified = pdfText.replace(/гіперінфляція/gi, 'швидке зростання цін')
                            .replace(/зміна клімату/gi, 'глобальне потепління')
                            .replace(/екологічна політика/gi, 'правила для захисту природи');

    let summary = '';
    let matches = '';

    loading.innerHTML = '<div class="spinner"></div>Генерую переказ та пошук...';
    progressFill.style.width = '100%';

    if (llm) {
      const summaryPrompt = `Зроби короткий переказ тексту українською (3 речення, простими словами): ${pdfText.substring(0, 2000)}`;
      const summaryReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: summaryPrompt }], max_tokens: 150 });
      summary = summaryReply.choices[0].message.content;

      const searchPrompt = `Знайди співпадіння по ключам "${keywords}" у тексті, вкажи сторінки та пов'язані терміни українською: ${pdfText}`;
      const searchReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: searchPrompt }], max_tokens: 200 });
      matches = searchReply.choices[0].message.content;
    } else {
      // Fallback
      const sentences = pdfText.split(/[\.\!\?]\s+/).slice(0, 3).join('. ');
      summary = `Короткий переказ (fallback): ${sentences}.`;

      const sections = pdfText.split(/--- Сторінка \d+ ---/);
      keywords.split(',').forEach(kw => {
        const lowerKw = kw.trim().toLowerCase();
        for (let i = 0; i < sections.length; i++) {
          if (sections[i].toLowerCase().includes(lowerKw)) {
            const related = sections[i].substring(0, 100).match(/\b\w+\b/g)?.slice(0,3).join(', ') || 'немає';
            matches += `${kw}: Знайдено на сторінці ${i+1} (пов'язані: ${related})\n`;
            return;
          }
        }
        matches += `${kw}: Не знайдено\n`;
      });
    }

    result.innerHTML = `
      <strong>Спрощений текст (перші 500 символів):</strong> ${simplified.substring(0, 500)}...<br>
      <strong>Переказ:</strong> ${summary}<br>
      <strong>Співпадіння по ключам:</strong> <pre>${matches}</pre>
    `;
    result.classList.remove('hidden');  // Активація fade-in
  } catch (error) {
    result.innerHTML = `Помилка: ${error.message}`;
    result.classList.add('error-shake');
    setTimeout(() => result.classList.remove('error-shake'), 500);
  } finally {
    loading.classList.add('hidden');
    progressBar.classList.add('hidden');
    progressFill.style.width = '0%';
  }
}

// Функція для toggle теми
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const icon = document.querySelector('.theme-toggle i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Завантаження теми з localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
  document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
}

initLLM();
// ... (решта коду як раніше, додай в кінець initLLM)

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const icon = document.querySelector('.theme-toggle i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Завантаження теми з localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
  document.querySelector('.theme-toggle i').classList.replace('fa-moon', 'fa-sun');
}
