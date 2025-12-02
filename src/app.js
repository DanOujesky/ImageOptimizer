import multer from "multer";
import { Worker } from "worker_threads";
import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";

const PORT = process.env.PORT;

const app = express();

app.use(express.static("public"));

const upload = multer({ dest: "input/" });

app.post("/upload", upload.array("images"), async (req, res) => {
  const workers = [];

  for (const file of req.files) {
    const worker = new Worker(path.resolve("src/worker.js"), {
      workerData: {
        inputPath: path.resolve(file.path),
        outputPath: path.resolve(`output/${file.filename}.webp`),
      },
    });

    workers.push(
      new Promise((resolve, reject) => {
        worker.on("message", resolve);
        worker.on("error", reject);
      })
    );
  }
  await Promise.all(workers);

  for (const file of req.files) {
    fs.unlinkSync(file.path);
  }

  res.json({ success: true, count: req.files.length });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
