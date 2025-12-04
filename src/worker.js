import sharp from "sharp";
import workerpool from "workerpool";

async function convert(inputPath, outputPath) {
  await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);

  return true;
}

workerpool.worker({
  convert,
});
