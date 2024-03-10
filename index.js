const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mern-job-portal.ugsufec.mongodb.net/?retryWrites=true&w=majority&appName=mern-job-portal`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create db
    const db = client.db("mernJobPortal");
    const jobCollections = db.collection("demoJobs");

    // get all jobs
    app.get("/all-jobs", async (req, res) => {
      const jobs = await jobCollections.find().toArray();

      res.status(200).json({
        success: true,
        jobs,
      });
    });

    // get jobs by id
    app.get("/all-jobs/:id", async (req, res) => {
      const jobId = req.params.id;

      try {
        // Convert the string ID to ObjectId
        const objectId = new ObjectId(jobId);

        // Find the job by ID in the 'jobCollections' collection
        const job = await jobCollections.findOne({ _id: objectId });

        if (job) {
          // Job found, send it in the response
          res.status(200).json(job);
        } else {
          // Job not found
          res.status(404).json({ error: "Job not found" });
        }
      } catch (error) {
        // Handle any errors, such as invalid ObjectId format
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Post a job
    app.post("/post-job", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();

      const result = await jobCollections.insertOne(body);
      if (result.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(400).send({
          message: "can not insert ! Try again",
          success: false,
        });
      }
    });

    // get jobs by user
    app.get("/myJobs/:email", async (req, res) => {
      const jobs = await jobCollections
        .find({ postedBy: req.params.email })
        .toArray();
      res.send(jobs);
    });

    // delete job
    app.delete("/api/jobsdelete/:id", async (req, res) => {
      let id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await jobCollections.deleteOne(filter);
      res.send(result);
    });

    // Update job by ID route
    app.patch("/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const filter = { _id: new ObjectId(id) };

      // Fix the typo in the options object - change 'upset' to 'upsert'
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          ...jobData,
        },
      };

      try {
        // Use updateOne to update or insert the job based on the ID
        const result = await jobCollections.updateOne(
          filter,
          updateDoc,
          options
        );

        // Check if the document was updated or inserted
        if (result.upsertedCount > 0) {
          res
            .status(201)
            .json({ message: "Job inserted successfully", result });
        } else if (result.modifiedCount > 0) {
          res.status(200).json({ message: "Job updated successfully", result });
        } else {
          // No document found to update or insert
          res.status(404).json({ error: "Job not found" });
        }
      } catch (error) {
        // Handle any errors, such as invalid ObjectId format
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Server");
});

app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
// username - utkarsh
// password - 1234
