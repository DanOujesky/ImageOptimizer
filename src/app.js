import multer from "multer";
import { Worker } from "worker_threads";
import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import workerpool from "workerpool";
import os from "os";

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const upload = multer({ dest: "input/" });
const jobsBySocket = new Map();

const pool = workerpool.pool(path.resolve("src/worker.js"), {
  maxWorkers: Math.max(1, os.cpus().length - 2),
});

console.log(pool.stats().totalWorkers);

app.use(express.static("public"));
app.use("/temp", express.static("temp"));

app.post("/upload", upload.array("images"), async (req, res) => {
  try {
    const workers = [];
    const socketId = req.body.socketId;
    const jobId = crypto.randomUUID();

    if (!jobsBySocket.has(socketId)) {
      jobsBySocket.set(socketId, []);
    }

    jobsBySocket.get(socketId).push(jobId);

    const jobInput = path.resolve(`temp/${jobId}/input`);
    const jobOutput = path.resolve(`temp/${jobId}/output`);

    fs.mkdirSync(jobInput, { recursive: true });
    fs.mkdirSync(jobOutput, { recursive: true });

    for (const file of req.files) {
      const newPath = path.join(jobInput, file.originalname);
      fs.renameSync(file.path, newPath);
      file.path = newPath;
    }
    for (const file of req.files) {
      const outputFilename = `${path.basename(
        file.originalname,
        path.extname(file.originalname)
      )}.webp`;

      const task = pool
        .exec("convert", [file.path, path.join(jobOutput, outputFilename)])
        .then(() => {
          io.to(socketId).emit("new-image-converted", {
            jobId,
            filename: outputFilename,
          });
        })
        .catch((err) => {
          console.error("Worker error:", err);
          cleanupJob(jobId);
        });

      workers.push(task);
    }

    await Promise.all(workers);

    res.json({ success: true, jobId });
  } catch (err) {
    cleanupJob(jobId);
    res.status(500).json({ error: "Conversion failed" });
  }
});
app.get("/download/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const jobOutput = path.resolve(`temp/${jobId}/output`);

  if (!fs.existsSync(jobOutput)) return res.status(404).send("Job not found");

  const zipPath = path.resolve(`temp/${jobId}/result.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip");

  output.on("close", () => {
    res.download(zipPath, "images.zip", () => {
      fs.rmSync(path.resolve(`temp/${jobId}`), {
        recursive: true,
        force: true,
      });
    });
  });

  archive.on("error", (err) => {
    throw err;
  });
  archive.pipe(output);

  fs.readdirSync(jobOutput).forEach((file) => {
    archive.file(path.join(jobOutput, file), { name: file });
  });

  archive.finalize();
});
io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const jobIds = jobsBySocket.get(socket.id) || [];
    jobIds.forEach(cleanupJob);
    jobsBySocket.delete(socket.id);
  });
});
function cleanupJob(jobId) {
  const jobFolder = path.resolve(`temp/${jobId}`);
  try {
    fs.rmSync(jobFolder, { recursive: true, force: true });
  } catch (err) {
    console.error("Failed to clean job folder:", jobId, err);
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
