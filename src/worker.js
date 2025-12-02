import sharp from "sharp";
import { parentPort, workerData } from "worker_threads";

async function convert() {
  const { inputPath, outputPath } = workerData;

  await sharp(inputPath)
    .webp({ quality: 80, lossless: true })
    .toFile(outputPath);

  parentPort.postMessage("done");
}

convert();
