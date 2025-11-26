const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const mongoUrl = "mongodb://127.0.0.1:27017"; // Local MongoDB connection
const dbName = "feedbackDB";
let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName);
        console.log("✅ Connected to MongoDB successfully");
    })
    .catch(err => {
        console.error("❌ Database connection error:", err);
        process.exit(1); // Exit process if DB connection fails
    });

// Handle feedback submission
app.post("/feedback", async (req, res) => {
    try {
        const { username, designation, project, rating, comment } = req.body;

        console.log("🔹 Received feedback data:", req.body);

        // Validate required fields
        if (!username?.trim() || !designation?.trim() || !project?.trim()) {
            console.warn("⚠️ Missing required fields");
            return res.status(400).json({ error: "Username, designation, and project description are required" });
        }

        const feedback = {
            username: username.trim(),
            designation: designation.trim(),
            project: project.trim(),
            rating: rating ? parseInt(rating) : 0, // Ensure rating is a number
            comment: comment?.trim() || "No comment provided",
            date: new Date()
        };

        if (!db) {
            console.error("❌ Database connection not initialized");
            return res.status(500).json({ error: "Database connection not available" });
        }

        const collection = db.collection("feedbacks");
        const result = await collection.insertOne(feedback);

        console.log("✅ Feedback stored successfully:", result);
        res.status(201).json({ message: "Feedback submitted successfully", feedback });
    } catch (error) {
        console.error("❌ Error submitting feedback:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
});

// Fetch feedback
app.get("/feedback", async (req, res) => {
    try {
        if (!db) {
            console.error("❌ Database connection not initialized");
            return res.status(500).json({ error: "Database connection not available" });
        }

        const collection = db.collection("feedbacks");
        const feedbacks = await collection.find().sort({ date: -1 }).toArray(); // Latest feedback first
        res.json(feedbacks);
    } catch (error) {
        console.error("❌ Error fetching feedback:", error);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
