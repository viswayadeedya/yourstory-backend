const express = require("express");
const { Part } = require("../models/part");
const { Story } = require("../models/story");
const mongoose = require("mongoose");
const multer = require("multer");
const router = express.Router();
const path = require("path");

const fileType = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = fileType[file.mimetype];
    let uploadError = new Error("Invalid file type");
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "./public/uploads");
  },
  filename: function (req, file, cb) {
    console.log(file.originalname);
    const fileName = file.originalname.split(" ").join("-");
    console.log(file.originalname);
    const extension = fileType[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage: storage });

// Get all stories
router.get(`/`, async (req, res) => {
  try {
    const storyList = await Story.find();
    if (!storyList) {
      res.status(500).json({ success: false });
    }
    res.send(storyList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get one story
router.get("/story/:id", (req, res) => {
  Story.findByIdAndUpdate(
    req.params.id,
    {
      $inc: { views: 1 },
    },
    { new: true }
  )
    .then((story) => {
      if (story) {
        story.views = story.views ? story.views + 1 : 1;
        res.status(200).json({ status: true, message: story });
      }
    })
    .catch((error) => {
      console.log(error.message);
      res.status(404).json({ status: false, error: error.message });
    });
});

// Get all parts
router.get("/getAllparts/:id", (req, res) => {
  Story.findById(req.params.id)
    .then((story) => {
      res.status(200).json({ status: true, message: story.parts });
    })
    .catch((error) => {
      res.status(404).json({ status: false, error: error.message });
    });
});

// Get by category

router.get("/category/:name", (req, res) => {
  console.log(req.params.name);
  Story.find({ category: req.params.name })
    .then((story) => {
      res.status(200).json({ status: true, message: story });
    })
    .catch((error) => {
      res.status(404).json({ status: false, error: error.message });
    });
});

// (req, res, function (error) {
//   if (error) {
//     console.log(`upload.single error: ${error} , ${error.message}`);
//     // return res.sendStatus(500);
//   }

// Post new story
router.post("/new", upload.single("images"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file is available!");
      console.log(file);
      return res.send({
        success: false,
      });
    }
    const fileName = req.file.filename;
    console.log(req.file.filename);
    console.log(req.file);
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let newStory = new Story({
      userId: req.body.userId,
      title: req.body.title,
      description: req.body.description,
      image: `${basePath}${fileName}`,
      mainCharecters: req.body.mainCharecters,
      category: req.body.category,
      tags: req.body.tags,
      language: req.body.language,
    });

    newStory = await newStory.save();
    if (!newStory) {
      res
        .status(404)
        .json({ status: false, error: "some unknown error occured" });
    }
    res.status(200).json({ status: true, storyId: newStory.id });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

// Edit Story
router.post("/edit/:id", upload.single("images"), (req, res) => {
  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  Story.findByIdAndUpdate(
    req.params.id,
    {
      userId: req.body.userId,
      title: req.body.title,
      description: req.body.description,
      images: `${basePath}${fileName}`,
      mainCharecters: req.body.mainCharecters,
      category: req.body.category,
      tags: req.body.tags,
      language: req.body.language,
    },
    { new: true }
  )
    .then((story) => {
      res.status(200).json({ status: true, storyId: story });
    }) 
    .catch((err) => {
      res.status(500).json({ status: false, error: err.message });
    });
});

// Rating
router.get("/rate/:id", (req, res) => {
  Story.findByIdAndUpdate(req.params.id, { $inc: { rating: 1 } }, { new: true })
    .then((story) => {
      if (!story) {
        return res.status(404).json({ status: false, error: "Id not found" });
      }
      res.status(200).json({ status: true, response: story });
    })
    .catch((err) => {
      return res.status(400).json({ status: false, error: err });
    });
});

// Post new story part
router.put("/:id", (req, res) => {
  Story.findByIdAndUpdate(
    req.params.id,
    {
      $push: { parts: req.body.part },
    },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        return res.status(404).json({ status: false, error: "Id not found" });
      }
      res.status(200).json({ status: true, response: data });
    })
    .catch((err) => {
      return res.status(400).json({ status: false, error: err });
    });
});

// Delete story
router.delete(`/story/:id`, (req, res) => {
  Story.findById(mongoose.Types.ObjectId(req.params.id))
    .then((result) => {
      console.log(result);
      result.parts.map((part) => {
        Part.findByIdAndRemove(part._id, { useFindAndModify: false })
          .then(() => {
            console.log("deleted sucessfully");
          })
          .catch((err) => {
            console.log(err.message);
          });
      });
    })
    .catch((err) => {
      console.log(err.message);
    });
  Story.findByIdAndRemove(req.params.id, { useFindAndModify: false })
    .then((story) => {
      if (story) {
        return res
          .status(200)
          .json({ success: true, message: "the story has been deleted" });
      } else {
        return res.status(404).json({
          sucess: false,
          message: "story not found!",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
