const searchInput = document.getElementById("searchInput");
const content = document.getElementById("content");

const originalHTML = content.innerHTML;

searchInput.addEventListener("input", () => {
    const text = searchInput.value.trim();

    if (text === "") {
        content.innerHTML = originalHTML;
        return;
    }

    const regex = new RegExp(`(${text})`, "gi");
    const highlighted = originalHTML.replace(regex, `<mark>$1</mark>`);

    content.innerHTML = highlighted;
});
