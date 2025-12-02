const convertImages = async () => {
  const files = document.getElementById("images").files;
  if (files.length === 0) {
    alert("You must select at least one image.");
    return;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  try {
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }
  } catch (err) {
    console.error(err);
  }
};

document
  .getElementById("convert-button")
  .addEventListener("click", convertImages);

document.getElementById("download-button").addEventListener("click", () => {
  window.location.href = "http://localhost:5000/download";
});
document.getElementById("images").addEventListener("change", (event) => {
  const previewContainer = document.getElementById("preview-container");
  previewContainer.innerHTML = "";

  const files = event.target.files;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      previewContainer.appendChild(img);
    };

    reader.readAsDataURL(file);
  });
});
