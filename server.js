require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Serve uploaded PDF files
app.use("/uploads", express.static("uploads"));

// ✅ Configure Multer for PDF Uploads
const storage = multer.diskStorage({
  destination: "uploads/", // Store PDFs in the 'uploads' folder
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
  },
});

const upload = multer({ storage });

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Tender Schema
const TenderSchema = new mongoose.Schema({
  title: String,
  duration: String,
  cost: Number,
  address: String,
  contact: String,
  pdfURL: String,
  needed: { type: Boolean, default: true } // ✅ Added tender availability status
});

const Tender = mongoose.model("Tender", TenderSchema);

// ✅ API Route to Add a Tender (with PDF Upload)
app.post("/addTender", upload.single("pdfFile"), async (req, res) => {
  try {
    const newTender = new Tender({
      title: req.body.title,
      duration: req.body.duration,
      cost: req.body.cost,
      address: req.body.address,
      contact: req.body.contact,
      pdfURL: req.file ? `/uploads/${req.file.filename}` : "", // Save file path
      needed: req.body.needed === "true" // ✅ Handle tender availability
    });

    await newTender.save();
    res.status(201).json({ message: "✅ Tender added successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API Route to Get All Tenders
app.get("/getTenders", async (req, res) => {
  try {
    const tenders = await Tender.find();
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API Route to Get a Single Tender by ID
app.get("/getTender/:id", async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: "Tender not found" });
    }
    res.json(tender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API Route to Delete a Tender
app.delete("/deleteTender/:id", async (req, res) => {
  try {
    await Tender.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Tender deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API Route to Update a Tender (Allow Updating Details and PDF)
app.put("/updateTender/:id", upload.single("pdfFile"), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: "Tender not found" });
    }

    // Update tender fields
    tender.title = req.body.title;
    tender.duration = req.body.duration;
    tender.cost = req.body.cost;
    tender.address = req.body.address;
    tender.contact = req.body.contact;
    tender.needed = req.body.needed === "true";

    // If a new file is uploaded, update the PDF URL
    if (req.file) {
      tender.pdfURL = `/uploads/${req.file.filename}`;
    }

    await tender.save();
    res.json({ message: "✅ Tender updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API Route to Toggle "Tender Needed" Status
app.put("/toggleTender/:id", async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ error: "Tender not found" });
    }
    
    tender.needed = !tender.needed; // Toggle status
    await tender.save();
    res.json({ message: "✅ Tender availability updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
