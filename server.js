import { Client } from "@gradio/client"; // Note the changed import
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your NextJS server URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
}).fields([
  { name: "human", maxCount: 1 },
  { name: "garment", maxCount: 1 },
]);

const handleMulterUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    next();
  });
};

let gradioClient = null;

async function initializeGradioClient() {
  try {
    gradioClient = await Client.connect("Nymbo/Virtual-Try-On");
    console.log("Gradio client initialized successfully");
    return gradioClient;
  } catch (error) {
    console.error("Failed to initialize Gradio client:", error);
    throw error;
  }
}

function validateParams(params) {
  return {
    maskingMode: ["auto", "manual"].includes(params.maskingMode)
      ? params.maskingMode
      : "auto",
    denoisingSteps: 30,
    seed: 42,
    useAutoMask: true,
    enhanceOutput: true,
  };
}

app.post("/api/virtual-tryon", handleMulterUpload, async (req, res) => {
  try {
    if (!req.files?.human?.[0] || !req.files?.garment?.[0]) {
      return res.status(400).json({
        success: false,
        error: "Both human and garment images are required",
      });
    }

    if (!gradioClient) {
      gradioClient = await initializeGradioClient();
    }

    const humanImage = new Blob([req.files.human[0].buffer], {
      type: req.files.human[0].mimetype,
    });
    const garmentImage = new Blob([req.files.garment[0].buffer], {
      type: req.files.garment[0].mimetype,
    });
    const params = validateParams(req.body);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 60000)
    );

    const predictionPromise = gradioClient.predict("/tryon", [
      { background: humanImage, layers: [], composite: null },
      garmentImage,
      params.maskingMode,
      params.useAutoMask,
      params.enhanceOutput,
      params.denoisingSteps,
      params.seed,
    ]);

    const result = await Promise.race([predictionPromise, timeoutPromise]);

    if (!result?.data?.[0]) {
      throw new Error("Invalid response from Gradio API");
    }

    console.log(result);

    res.json({
      success: true,
      data: {
        outputImage: result.data[0],
        maskedImage: result.data[1],
        params: params,
      },
    });
  } catch (error) {
    console.error("Virtual Try-On Error:", error);
    if (
      error.message.includes("connection") ||
      error.message.includes("network")
    ) {
      gradioClient = null;
    }
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process virtual try-on request",
      errorType: error.name,
      errorDetails:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    gradioClient: !!gradioClient,
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeGradioClient();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
