
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster5.ere94.mongodb.net/?retryWrites=true&w=majority`;

// MongoClient configuration
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const queriesCollection = client.db("productQueryDB").collection("queries");
    const commentsCollection = client.db("productQueryDB").collection("comments");

    // Create a new query
    app.post("/queries", async (req, res) => {
      const {
        productName,
        productBrand,
        productImageUrl,
        queryTitle,
        boycottingReasonDetails,
        userEmail,
        userName,
        userProfileImage,
      } = req.body;

      const query = {
        productName,
        productBrand,
        productImageUrl,
        queryTitle,
        boycottingReasonDetails,
        userEmail,
        userName,
        userProfileImage,
        recommendationCount: 0,
        createdAt: new Date(),
      };

      try {
        const result = await queriesCollection.insertOne(query);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create query." });
      }
    });

    // Get all queries
    app.get("/queries", async (req, res) => {
      try {
        const queries = await queriesCollection.find().toArray();
        res.status(200).send(queries);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch queries." });
      }
    });

    // Get a single query by ID
    app.get("/queries/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const query = await queriesCollection.findOne({ _id: new ObjectId(id) });
        if (query) {
          res.status(200).send(query);
        } else {
          res.status(404).send({ error: "Query not found." });
        }
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch query." });
      }
    });

    // Get queries by user email
    app.get("/myqueries/:userEmail", async (req, res) => {
      const { userEmail } = req.params;

      try {
        const userQueries = await queriesCollection.find({ userEmail }).toArray();
        res.status(200).send(userQueries);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user queries." });
      }
    });

    // Add a new comment to a query
    app.post("/comments", async (req, res) => {
      const {
        query_id,
        recommendationTitle,
        recommendedProductName,
        recommendedProductImage,
        recommendationReason,
        userEmail,
        recommenderEmail,
        recommenderName,
      } = req.body;

      const newComment = {
        query_id: new ObjectId(query_id),
        recommendationTitle,
        recommendedProductName,
        recommendedProductImage,
        recommendationReason,
        userEmail,
        recommenderEmail,
        recommenderName,
        created_at: new Date(),
      };

      try {
        const result = await commentsCollection.insertOne(newComment);

        // Increment the recommendation count in the query
        await queriesCollection.updateOne(
          { _id: new ObjectId(query_id) },
          { $inc: { recommendationCount: 1 } }
        );

        res.status(201).send(result.ops[0]);
      } catch (error) {
        res.status(500).send({ error: "Failed to add comment." });
      }
    });

    // Get comments for a specific query
    app.get("/Indivucomments/:query_id", async (req, res) => {
      const { query_id } = req.params;

      try {
        const comments = await commentsCollection.find({ query_id: new ObjectId(query_id) }).toArray();
        res.status(200).send(comments);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch comments." });
      }
    });

    // Delete a comment and update recommendation count
    app.delete("/comments/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });

        if (!comment) {
          return res.status(404).send({ error: "Comment not found." });
        }

        await commentsCollection.deleteOne({ _id: new ObjectId(id) });

        // Decrement recommendation count in the query
        await queriesCollection.updateOne(
          { _id: comment.query_id },
          { $inc: { recommendationCount: -1 } }
        );

        res.status(200).send({ message: "Comment deleted successfully." });
      } catch (error) {
        res.status(500).send({ error: "Failed to delete comment." });
      }
    });

    app.get("/", (req, res) => {
      res.send("Server is running...");
    });
  } catch (error) {
    console.error("Error in server setup:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

