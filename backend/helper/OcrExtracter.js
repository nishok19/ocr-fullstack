const fs = require("fs");
const pdf = require("pdf-parse");
const pdf2pic = require("pdf2pic");
const Tesseract = require("tesseract.js");
const path = require("path");

class MultiFormatOCRExtractor {
  constructor() {
    this.tesseractWorker = null;
    this.supportedFormats = [".pdf", ".png", ".jpg", ".jpeg"];
  }

  async initializeTesseract() {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await Tesseract.createWorker("eng");
    }
    return this.tesseractWorker;
  }

  detectFileType(input) {
    let extension = "";

    if (typeof input === "string") {
      // File path
      extension = path.extname(input).toLowerCase();
    } else if (Buffer.isBuffer(input)) {
      if (input.length >= 4) {
        if (input.toString("ascii", 0, 4) === "%PDF") {
          extension = ".pdf";
        } else if (
          input[0] === 0x89 &&
          input[1] === 0x50 &&
          input[2] === 0x4e &&
          input[3] === 0x47
        ) {
          extension = ".png";
        } else if (input[0] === 0xff && input[1] === 0xd8) {
          extension = ".jpg";
        }
      }
    } else if (input.mimetype) {
      // Express multer file object
      const mimeToExt = {
        "application/pdf": ".pdf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
      };
      extension = mimeToExt[input.mimetype] || "";
    }

    if (!this.supportedFormats.includes(extension)) {
      throw new Error(
        `Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(
          ", "
        )}`
      );
    }

    return extension;
  }

  async extractText(input, options = {}) {
    const {
      ocrLanguage = "eng",
      imageQuality = 300,
      fallbackToOCR = true,
    } = options;

    try {
      const fileType = this.detectFileType(input);
      console.log(`Detected file type: ${fileType}`);

      switch (fileType) {
        case ".pdf":
          return await this.extractFromPDF(input, {
            fallbackToOCR,
            ocrLanguage,
            imageQuality,
          });

        case ".png":
        case ".jpg":
        case ".jpeg":
          return await this.extractFromImage(input, ocrLanguage);

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      throw error;
    }
  }

  async extractFromPDF(input, options = {}) {
    const { fallbackToOCR, ocrLanguage, imageQuality } = options;

    try {
      // Handle different input types
      let pdfBuffer;
      let filePath;

      if (typeof input === "string") {
        // File path
        filePath = input;
        pdfBuffer = fs.readFileSync(input);
      } else if (Buffer.isBuffer(input)) {
        // Buffer
        pdfBuffer = input;
        // Create temp file for pdf2pic
        filePath = path.join(__dirname, "temp", `temp_${Date.now()}.pdf`);
        this.ensureTempDir();
        fs.writeFileSync(filePath, pdfBuffer);
      } else if (input.buffer) {
        // Multer file object
        pdfBuffer = input.buffer;
        filePath = path.join(__dirname, "temp", `temp_${Date.now()}.pdf`);
        this.ensureTempDir();
        fs.writeFileSync(filePath, pdfBuffer);
      }

      // First try: Extract text directly (for text-based PDFs)
      const textContent = await this.extractDirectTextFromPDF(pdfBuffer);

      // Check if we got meaningful text
      if (textContent && textContent.trim().length > 50) {
        console.log("✅ Direct PDF text extraction successful");
        return {
          method: "direct",
          fileType: "pdf",
          text: textContent,
          pages: textContent.split("\n\n").length,
        };
      }

      // Fallback: Use OCR for image-based PDFs
      if (fallbackToOCR && filePath) {
        console.log("📷 Falling back to PDF OCR extraction...");
        return await this.extractPDFWithOCR(
          filePath,
          ocrLanguage,
          imageQuality,
          pdfBuffer
        );
      }

      return {
        method: "direct",
        fileType: "pdf",
        text: textContent || "",
        pages: 1,
      };
    } catch (error) {
      console.error("Error extracting from PDF:", error);
      throw error;
    }
  }

  async extractDirectTextFromPDF(pdfBuffer) {
    const data = await pdf(pdfBuffer);
    return data.text;
  }

  async extractPDFWithOCR(
    filePath,
    language = "eng",
    quality = 300,
    pdfBuffer
  ) {
    try {
      await this.initializeTesseract();

      // Convert PDF to images
      const convert = pdf2pic.fromPath(filePath, {
        density: quality,
        saveFilename: "page",
        savePath: "./temp/",
        format: "png",
        width: 2000,
        height: 2000,
      });

      // Get PDF info
      const pdfData = await pdf(pdfBuffer);
      const totalPages = pdfData.numpages;

      let extractedText = "";
      const results = [];

      // Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          console.log(`Processing PDF page ${pageNum}/${totalPages}...`);

          const pageImage = await convert(pageNum, { responseType: "image" });
          const {
            data: { text },
          } = await this.tesseractWorker.recognize(pageImage.base64);

          extractedText += `\n--- Page ${pageNum} ---\n${text}\n`;
          results.push({
            page: pageNum,
            text: text.trim(),
          });
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          results.push({
            page: pageNum,
            text: "",
            error: pageError.message,
          });
        }
      }

      return {
        method: "ocr",
        fileType: "pdf",
        text: extractedText.trim(),
        pages: totalPages,
        results: results,
      };
    } catch (error) {
      console.error("PDF OCR extraction failed:", error);
      throw error;
    }
  }

  async extractFromImage(input, language = "eng") {
    try {
      await this.initializeTesseract();

      let imageInput;

      if (typeof input === "string") {
        // File path
        imageInput = input;
        console.log(`📷 Processing image file: ${input}`);
      } else if (Buffer.isBuffer(input)) {
        // Buffer
        imageInput = input;
        console.log("📷 Processing image buffer");
      } else if (input.buffer) {
        // Multer file object
        imageInput = input.buffer;
        console.log(`📷 Processing uploaded image: ${input.originalname}`);
      }

      const {
        data: { text, confidence },
      } = await this.tesseractWorker.recognize(imageInput);

      return {
        method: "ocr",
        fileType: "image",
        text: text.trim(),
        confidence: confidence,
        pages: 1,
      };
    } catch (error) {
      console.error("Image OCR extraction failed:", error);
      throw error;
    }
  }

  ensureTempDir() {
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  cleanupTempFiles() {
    const tempDir = path.join(__dirname, "temp");
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
  }

  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
    this.cleanupTempFiles();
  }
}

module.exports = MultiFormatOCRExtractor;
