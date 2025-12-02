const convertImage = async () => {
  const files = document.getElementById("images").files;
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  await fetch("/upload", {
    method: "POST",
    body: formData,
  });
};

document
  .getElementById("convert-button")
  .addEventListener("click", convertImages);
