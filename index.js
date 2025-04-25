require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173',
    'http://localhost:5171',
    'http://localhost:5175',
    'http://localhost:5174',
    'https://skincare-299.netlify.app',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT token verification middleware 
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  //console.log("Token:", token); // Log the token
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access: No token provided" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      //console.log("JWT Error:", err); // Log the error
      return res.status(401).send({ message: "Unauthorized access: Invalid token" });
    }
    req.user = decoded;
    next();
  });
};


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
      // await client.connect();

      const queriesCollection = client.db("productQueryDB").collection("queries");
      const commentsCollection = client
        .db("productQueryDB")
        .collection("comments");


      // Auth related apis: 
      app.post("/JWT", (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "4h",
        });
        res.cookie("token", token, { httpOnly: true,  secure: process.env.NODE_ENV === "production",sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", }).send({ success: true });
      });

      app.post('/logout', (req, res) => {
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }).send({ success: true });
      });


      // Create a new query
      app.post("/queries",verifyToken, async (req, res) => {
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
      app.get("/queries",  async (req, res) => {
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
          const query = await queriesCollection.findOne({
            _id: new ObjectId(id),
          });
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
      app.get("/myqueries/:userEmail",verifyToken, async (req, res) => {
        const { userEmail } = req.params;

        try {
          const userQueries = await queriesCollection
            .find({ userEmail })
            .toArray();
          res.status(200).send(userQueries);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch user queries." });
        }
      });

      // Update a query by ID
      app.put("/queries/:id",verifyToken, async (req, res) => {
        const { id } = req.params;
        const {
          productName,
          productBrand,
          productImageUrl,
          queryTitle,
          boycottingReasonDetails,
        } = req.body;
        try {
          const result = await queriesCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                productName,
                productBrand,
                productImageUrl,
                queryTitle,
                boycottingReasonDetails,
              },
            }
          );
          if (result.modifiedCount === 0) {
            return res
              .status(404)
              .send({ error: "Query not found or no changes made." });
          }
          res.status(200).send({ message: "Query updated successfully." });
        } catch (error) {
          res.status(500).send({ error: "Failed to update query." });
        }
      });

      // Delete a query by ID and handle recommendation count update
      app.delete("/queries/:id",verifyToken, async (req, res) => {
        const { id } = req.params;
        try {
          const query = await queriesCollection.findOne({
            _id: new ObjectId(id),
          });
          if (!query) {
            return res.status(404).send({ error: "Query not found." });
          }
          await queriesCollection.deleteOne({ _id: new ObjectId(id) });
          await commentsCollection.deleteMany({ query_id: new ObjectId(id) });
          res.status(200).send({
            message: "Query and related recommendations deleted successfully.",
          });
        } catch (error) {
          res.status(500).send({ error: "Failed to delete query." });
        }
      });

      // Get queries by exact product name
      app.get("/searchqueries", async (req, res) => {
        const { productName } = req.query;
        try {
          const searchResult = await queriesCollection.find({ productName }).toArray();
          //console.log(searchResult);

          res.status(200).send(searchResult);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch queries." });
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
          await queriesCollection.updateOne(
            { _id: new ObjectId(query_id) },
            { $inc: { recommendationCount: 1 } }
          );
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to add comment." });
        }
      });

      // Get comments for a specific query
      app.get("/Indivucomments/:query_id", async (req, res) => {
        const { query_id } = req.params;
        try {
          const comments = await commentsCollection
            .find({ query_id: new ObjectId(query_id) })
            .toArray();
          res.status(200).send(comments);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch comments." });
        }
      });

      // Get comments for a specific query
      app.get("/Comments/:userEmail", async (req, res) => {
        const { userEmail } = req.params;

        try {
          const Comments = await commentsCollection.find({ userEmail }).toArray();
          res.status(200).send(Comments);
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch user queries." });
        }
      });

      // Delete a comment and update recommendation count
      app.delete("/comments/:id", async (req, res) => {
        const { id } = req.params;
        try {
          const comment = await commentsCollection.findOne({
            _id: new ObjectId(id),
          });
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
    //console.log(`Server is running on port ${port}`);
  });
