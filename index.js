require('dotenv').config()
const express= require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster5.ere94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster5`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      // jobs related apis
      const jobsCollection = client.db('jobportal').collection('job_hunter');
      const jobApplicationCollection = client.db('jobportal').collection('job_applications');


  } finally {
      // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('server chole');
})

app.listen(port,()=>{
    console.log(`job is running in port : ${port}`);
})