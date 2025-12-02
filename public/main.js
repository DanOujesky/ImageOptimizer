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
