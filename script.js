// Частина: Пошук по тексту інструкції
const searchInput = document.getElementById("searchInput");
const content = document.getElementById("content");
const originalContentHTML = content.innerHTML;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (!query) {
    content.innerHTML = originalContentHTML;
    return;
  }
  const regex = new RegExp(`(${query})`, "gi");
  const highlighted = originalContentHTML.replace(regex, `<mark>$1</mark>`);
  content.innerHTML = highlighted;
});


// Частина: Завантаження PDF та аналіз (простий приклад)
const fileInput = document.getElementById("file-input");
const analyzeBtn = document.getElementById("analyze-btn");

analyzeBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Будь ласка, оберіть PDF-файл!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    // Тут ти викликаєш функцію аналізу PDF — це залежить від того, як раніше робив
    analyzePDF(arrayBuffer);
  };
  reader.readAsArrayBuffer(file);
});

// Приклад функції аналізу — заміни на свою логіку
function analyzePDF(buffer) {
  // Наприклад, ти використовуєш pdf.js або іншу бібліотеку
  console.log("PDF завантажено, розмір (байт):", buffer.byteLength);
  content.innerHTML = `<p>PDF завантажено, розмір: ${buffer.byteLength} байт</p>`;
  // Тут — твій код аналізу
}
