let llm = null;
let pdfText = '';

async function initLLM() {
  const selectedModel = await webllm.GetWebLLMModel('Gemma-2B-2bit');  // Легка модель для UA, аналог nano-vllm
  llm = await selectedModel.create();  // Офлайн-інференс
}

async function analyzePDF() {
  const fileInput = document.getElementById('pdfInput');
  const file = fileInput.files[0];
  if (!file) return alert('Обери PDF!');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  pdfText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    pdfText += textContent.items.map(item => item.str).join(' ') + '\n--- Сторінка ' + i + ' ---\n';
  }

  const keywords = document.getElementById('keywordsInput').value;

  // Переказ (промпт як у nano-vllm)
  const summaryPrompt = `Зроби короткий переказ тексту українською (3 речення): ${pdfText.substring(0, 2000)}`;
  const summaryReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: summaryPrompt }], max_tokens: 150 });
  const summary = summaryReply.choices[0].message.content;

  // Пошук ключів
  const searchPrompt = `Знайди співпадіння по ключам "${keywords}" у тексті, вкажи сторінки та пов'язані терміни: ${pdfText}`;
  const searchReply = await llm.chat.completions.create({ messages: [{ role: 'user', content: searchPrompt }], max_tokens: 200 });
  const matches = searchReply.choices[0].message.content;

  document.getElementById('result').innerHTML = `<strong>Переказ:</strong> ${summary}<br><strong>Співпадіння:</strong> ${matches}`;
}

initLLM();  // Ініціалізуй LLM при завантаженні