const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const shortid = require("shortid");
const Url = require("./Url");
const utils = require("./utils/util");

// configure dotenv
dotenv.config({ path: "./config.env" });
const app = express();

// cors for cross-origin requests to the frontend application
app.use(cors());
// parse requests of content-type - application/json
app.use(express.json());

// Database connection
const DB = process.env.DATABASE.replace(
  "<password>",
  encodeURIComponent(process.env.DataBasePassWord)
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connection successfully..."))
  .catch((err) => console.error("DB connection error:", err));

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "/"));
});
// get all saved URLs
app.get("/all", async (req, res) => {
  try {
    const data = await Url.find();

    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    res.status(500).json("Server Error");
  }
});

// URL shortener endpoint
app.post("/short", async (req, res) => {
  const { origUrl } = req.body;
  const base = `http://localhost:3000`;
  const urlId = shortid.generate();
  if (utils.validateUrl(origUrl)) {
    try {
      let url = await Url.findOne({ origUrl });
      if (url) {
        res.status(200).json({ data: url });
      } else {
        const shortUrl = `${base}/${urlId}`;

        url = new Url({
          origUrl,
          shortUrl,
          urlId,
          date: new Date(),
        });

        await url.save();
        res.status(201).json({ data: url });
      }
    } catch (err) {
      console.error("Error saving/fetching URL:", err);
      res.status(500).json("Server Error");
    }
  } else {
    res.status(400).json("Invalid Original Url");
  }
});

// redirect endpoint
app.get("/:urlId", async (req, res) => {
  try {
    const url = await Url.findOne({ urlId: req.params.urlId });
    if (url) {
      url.clicks++;
      await url.save();
      res.redirect(url.origUrl);
    } else {
      res.status(404).json("Not found");
    }
  } catch (err) {
    console.error("Error fetching/redirection URL:", err);
    res.status(500).json("Server Error");
  }
});

// Port Listenning on 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
