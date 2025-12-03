import multer from "multer";
import { Worker } from "worker_threads";
import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { Server } from "socket.io";
import http from "http";

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ dest: "input/" });

app.use(express.static("public"));
app.use("/output", express.static("output"));

app.post("/upload", upload.array("images"), async (req, res) => {
  const workers = [];

  for (const file of req.files) {
    const outputFilename = `${file.filename}.webp`;
    const worker = new Worker(path.resolve("src/worker.js"), {
      workerData: {
        inputPath: path.resolve(file.path),
        outputPath: path.resolve(`output/${outputFilename}`),
      },
    });

    workers.push(
      new Promise((resolve, reject) => {
        worker.on("message", (message) => {
          io.emit("new-image-converted", outputFilename);
          resolve(message);
        });
        worker.on("error", reject);
      })
    );
  }
  await Promise.all(workers);

  res.json({ success: true, count: req.files.length });
});
app.get("/download", (req, res) => {
  const output = fs.createWriteStream("output.zip");
  const archive = archiver("zip");

  output.on("close", () => {
    res.download("output.zip", "images.zip", (err) => {
      if (err) console.error(err);
      fs.unlinkSync("output.zip");
    });
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  fs.readdirSync("output").forEach((file) => {
    archive.file(path.join("output", file), { name: file });
  });

  archive.finalize();
});

function clearFolder(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
