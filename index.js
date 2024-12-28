require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster5.ere94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster5`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const queriesCollection = client.db('productQueryDB').collection('queries');
    const commentsCollection = client.db('productQueryDB').collection('comments');

    // // Endpoint to create a new query
    // app.post('/queries', async (req, res) => {
    //   const { title, description, user_id } = req.body;
    //   const query = { title, description, user_id: ObjectId(user_id), commentCount: 0, created_at: new Date() };
    //   const result = await queriesCollection.insertOne(query);
    //   res.status(201).send(result.ops[0]);
    // });

    // Endpoint to create a new query
    app.post('/queries', async (req, res) => {
      const {productName,productBrand,productImageUrl, queryTitle, boycottingReasonDetails,userEmail,userName,userProfileImage, } = req.body;
      const query = { userEmail,userName,userProfileImage,productName,productBrand,productImageUrl,queryTitle, boycottingReasonDetails, recommendationCount: 0, createdAt: new Date() };
      const result = await queriesCollection.insertOne(query);
      res.send(result);
    });


    // Fetch queries with comment count
    app.get('/queries', async (req, res) => {
      const queries = await queriesCollection.find().toArray();
      res.send(queries);
    });

    // Fetch a specific query by id
    app.get('/queries/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.findOne(query);
      res.send(result);
    });
    
    // Fetch queries added by a specific user
    app.get('/myqueries/:userEmail', async (req, res) => {
      const userEmail = req.params.userEmail;
      const query = { userEmail: userEmail };
      try {
        const myQueries = await queriesCollection.find(query).toArray();
        res.send(myQueries);
      } catch (error) {
        res.status(500).send({ error: 'An error occurred while fetching the queries.' });
      }
    });
    
    // Endpoint to add a comment to a query and update comment count
    app.post('/comments', async (req, res) => {
      const { query_id, comment, user_id } = req.body;
      const newComment = { query_id: ObjectId(query_id), comment, user_id: ObjectId(user_id), created_at: new Date() };
      await commentsCollection.insertOne(newComment);
      await queriesCollection.updateOne({ _id: ObjectId(query_id) }, { $inc: { commentCount: 1 } });
      res.status(201).send(newComment);
    });

    // Endpoint to delete a comment and update comment count
    app.delete('/comments/:id', async (req, res) => {
      const commentId = req.params.id;
      try {
        const comment = await commentsCollection.findOne({ _id: ObjectId(commentId) });
        if (!comment) {
          return res.status(404).send({ error: 'Comment not found' });
        }
        await commentsCollection.deleteOne({ _id: ObjectId(commentId) });

        await queriesCollection.updateOne({ _id: ObjectId(comment.query_id) }, { $inc: { commentCount: -1 } });

        res.status(200).send({ message: 'Comment deleted successfully' });
      } catch (error) {
        res.status(500).send({ error: 'An error occurred while deleting the comment' });
      }
    });

    // Fetch comments for a specific query by query_id
    app.get('/comments/:productName', async (req, res) => {
      const productName = req.params.productName;
      const query = { productName: productName };
      const comments = await commentsCollection.find(query).toArray();
      res.send(comments);
    });



    // Fetch comments added by a specific user
    app.get('/comments/:userEmail', async (req, res) => {
      const userEmail = req.params.userEmail;
      const query = { userEmail: userEmail };
      const myComments = await commentsCollection.find(query).toArray();
      res.send(myComments);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log("server is running on port:", port);
});
