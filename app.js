let llm = null;
let pdfText = '';

async function initLLM() {
  document.getElementById('loading').style.display = 'block';
  try {
    const selectedModel = await webllm.GetWebLLMModel('Gemma-2B-2bit');  // Легка модель
    llm = await selectedModel.create();
    document.getElementById('loading').innerHTML = 'Модель готова!';
  } catch (error) {
    console.error('LLM error:', error);
    document.getElementById('loading').innerHTML = 'Fallback-режим (без LLM, тільки базовий аналіз)';
    llm = null;  // Fallback
  }
  document.getElementById('loading').style.display = 'none';
}

async function analyzePDF() {
  const fileInput = document.getElementById('pdfInput');
  const file = fileInput.files[0];
  if (!file) return alert('Обери PDF!');

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  const pdf = await loadingTask.promise;
  pdfText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    pdfText += textContent.items.map(item => item.str).join(' ') + '\n--- Сторінка ' + i + ' ---\n';
  }

  const keywords = document.getElementById('keywordsInput').value;

  // Спрощення тексту (заміна UA-термінів)
  let simplified = pdfText.replace(/гіперінфляція/gi, 'швидке зростання цін')
                          .replace(/зміна клімату/gi, 'глобальне потепління')
                          .replace(/екологічна політика/gi, 'правила для захисту природи');

  let summary = '';
  let matches = '';

  if (llm) {
    // Переказ через LLM
    const summaryPrompt = `Зроби короткий переказ тексту українською (3 речення, простими словами): ${pdfText.substring(0, 2000)}`;
    const summaryReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: summaryPrompt }], max_tokens: 150 });
    summary = summaryReply.choices[0].message.content;

    // Пошук ключів
    const searchPrompt = `Знайди співпадіння по ключам "${keywords}" у тексті, вкажи сторінки та пов'язані терміни українською: ${pdfText}`;
    const searchReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: searchPrompt }], max_tokens: 200 });
    matches = searchReply.choices[0].message.content;
  } else {
    // Fallback (базовий)
    const sentences = pdfText.split(/[\.\!\?]\s+/).slice(0, 3).join('. ');
    summary = `Короткий переказ (fallback): ${sentences}.`;

    const sections = pdfText.split(/--- Сторінка \d+ ---/);
    keywords.split(',').forEach(kw => {
      const lowerKw = kw.trim().toLowerCase();
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].toLowerCase().includes(lowerKw)) {
          matches += `${kw}: Знайдено на сторінці ${i+1} (пов'язані: ${sections[i].substring(0, 100).match(/\b\w+\b/g).slice(0,3).join(', ')})\n`;
          return;
        }
      }
      matches += `${kw}: Не знайдено\n`;
    });
  }

  document.getElementById('result').innerHTML = `
    <strong>Спрощений текст (перші 500 символів):</strong> ${simplified.substring(0, 500)}...<br>
    <strong>Переказ:</strong> ${summary}<br>
    <strong>Співпадіння по ключам:</strong> <pre>${matches}</pre>
  `;
}

initLLM();  // Запуск при завантаженні
