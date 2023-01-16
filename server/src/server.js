// "type": "module", in package.json allow the use of import
import express from "express";
import cors from "cors";
import { connectToDb, db, collection } from "./db.js"
import fs from "fs";
import admin from "firebase-admin";

// Below is necessary because we dont use "require" syntax for modules
// "type": "module" in package.json
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const credentials = JSON.parse(
  fs.readFileSync("./credentials.json")
);
admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const app = express();
app.use(express.json()); // When a json body is received it is automatically parsed
app.use(cors());
app.use(express.static(path.join(__dirname, "../build")));

// If request is everything else than something with /api
// send index.html
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
})

// "Middleware" that checks the authtoken in requests
// If user is found then it is added to the req object
app.use(async (req, res, next) => {
  const { authtoken } = req.headers;  
  if (authtoken) {
    try {
      req.user = await admin.auth().verifyIdToken(authtoken); // verify the authtoken
    } catch (error) {
      res.sendStatus(400); // If user couldnt be authenticated send status 400
      return; // Dont proceed with next
    }        
  }
  
  // If user was not filled from token, make sure the user object is an empty object
  req.user = req.user || {};
  
  next(); // Continue  
});

app.get("/api/articles/:name", async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;
  
  const article = await collection.findOne({ name });
  
  if (article) {
    const upvoteIds = article.upvoteIds || [];
    article.canUpvote = uid && !upvoteIds.includes(uid); // articles can only be upvoted if user is logged in and if user has not already upvoted an article
    console.log(`Article ${article.name} found`);
    res.json(article);
  }
  else {
    res.sendStatus(404);
  }
  
});

app.use((req, res, next) => {
  // Add middleware that checks for any logged in user  
  if (req.user) {
    next();
  }
  else {
    res.sendStatus(401);
  }  
});


app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params; // this is how to get the URL parameter
  const { uid } = req.user;
  
  const article = await collection.findOne({ name });
  
  if (article) {
    const upvoteIds = article.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.includes(uid) // articles can only be upvoted if user is logged in and if user has not already upvoted an article
    
    if (canUpvote) {
      await collection.updateOne({ name }, {
        // MongoDB syntax for updating a value by 1
        $inc: { upvotes: 1 },
        $push: { upvoteIds: uid }
      });      
    }
    
    // Send the updated article back as a response
    const updatedArticle = await collection.findOne({ name });   
    res.json(updatedArticle);
  }
  else {
    res.send("That article doesn't exist.");
  }
  
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { text } = req.body;
  const { email } = req.user;
  
  await collection.updateOne({ name }, {
    // MongoDB syntax for pushing into the "comments" array in a document
    $push: { comments: { postedBy: email, text } }
  });
  
  
  // Get the updated document for the response
  const article = await collection.findOne({ name });  
  
  if (article) {    
    res.json(article);
  }
  else {
    res.send("That article doesn't exist.");
  }
});

const PORT = process.env.PORT || 8000;


async function startServer() {
  await connectToDb("mongodb://127.0.0.1:27017", "react-blog-db", "articles");
  app.listen(PORT, () => { console.log("Server is listening on port " + PORT); });    
}

startServer();











