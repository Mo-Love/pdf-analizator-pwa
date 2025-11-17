let llm = null;
let pdfText = '';

async function initLLM() {
  const loading = document.getElementById('loading');
  loading.style.display = 'block';
  loading.innerHTML = '<div class="spinner"></div>Завантажую модель LLM...';

  try {
    const selectedModel = await webllm.GetWebLLMModel('Gemma-2B-2bit');
    llm = await selectedModel.create();
    loading.innerHTML = '<div class="spinner"></div>Модель готова!';
    setTimeout(() => loading.style.display = 'none', 1000);  // Fade out
  } catch (error) {
    console.error('LLM error:', error);
    loading.innerHTML = 'Fallback-режим (базовий аналіз без AI)';
    setTimeout(() => loading.style.display = 'none', 2000);
    llm = null;
  }
}

async function analyzePDF() {
  const fileInput = document.getElementById('pdfInput');
  const file = fileInput.files[0];
  if (!file) return alert('Обери PDF!');

  const loading = document.getElementById('loading');
  loading.style.display = 'block';
  loading.innerHTML = '<div class="spinner"></div>Аналізую PDF...';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pdfText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      pdfText += textContent.items.map(item => item.str).join(' ') + '\n--- Сторінка ' + i + ' ---\n';
    }

    const keywords = document.getElementById('keywordsInput').value;

    // Спрощення тексту
    let simplified = pdfText.replace(/гіперінфляція/gi, 'швидке зростання цін')
                            .replace(/зміна клімату/gi, 'глобальне потепління')
                            .replace(/екологічна політика/gi, 'правила для захисту природи');

    let summary = '';
    let matches = '';

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

    const result = document.getElementById('result');
    result.innerHTML = `
      <strong>Спрощений текст (перші 500 символів):</strong> ${simplified.substring(0, 500)}...<br>
      <strong>Переказ:</strong> ${summary}<br>
      <strong>Співпадіння по ключам:</strong> <pre>${matches}</pre>
    `;
    result.style.animation = 'slideIn 0.5s ease-out';  // Анімація появи
  } catch (error) {
    document.getElementById('result').innerHTML = `Помилка: ${error.message}`;
  } finally {
    loading.style.display = 'none';
  }
}

initLLM();
