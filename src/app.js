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

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ dest: "input/" });

app.use(express.static("public"));
app.use("/temp", express.static("temp"));

app.post("/upload", upload.array("images"), async (req, res) => {
  const workers = [];
  const socketId = req.body.socketId;
  const jobId = crypto.randomUUID();

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
    const worker = new Worker(path.resolve("src/worker.js"), {
      workerData: {
        inputPath: file.path,
        outputPath: path.join(jobOutput, outputFilename),
      },
    });

    workers.push(
      new Promise((resolve, reject) => {
        worker.on("message", () => {
          io.to(socketId).emit("new-image-converted", {
            jobId,
            filename: outputFilename,
          });
          resolve();
        });
        worker.on("error", reject);
      })
    );
  }

  await Promise.all(workers);

  res.json({ success: true, jobId });
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
  console.log("socket: " + socket.id);
  io.to(socket.id).emit("reset");
});
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
