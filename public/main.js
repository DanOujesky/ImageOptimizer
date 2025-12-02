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

const previewConvertedContainer = document.getElementById(
  "preview-converted-container"
);

const socket = io("http://localhost:5000");

socket.on("new-image-converted", (filename) => {
  const img = document.createElement("img");
  img.src = `/output/${filename}`;
  previewConvertedContainer.appendChild(img);
});
