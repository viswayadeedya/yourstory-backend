const express = require("express");
const mongoose = require("mongoose");
const { Part } = require("../models/part");
const { Story } = require("../models/story");
const multer = require("multer");
const router = express.Router();

const fileType = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = fileType[file.mimetype];
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = fileType[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage: storage });

// Get one part and increases views
router.get(`/:id`, async (req, res) => {
  Part.findById(req.params.id)
    .then((part) => {
      if (part) {
        Story.updateOne(
          { "parts._id": part._id },
          { $inc: { "parts.$.views": 1 } },
          { new: true }
        )
          .then((data) => {
            Story.find({ "parts._id": part._id })
              .then((result) => {
                const reqPart = result[0].parts.map((p) => {
                  if (p._id.equals(part._id)) {
                    return p;
                  }
                });
                res
                  .status(200)
                  .json({ status: true, message: reqPart.filter((n) => n) });
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.status(404).json({ message: "part not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        message: "The part with the given id does not exist",
        error: err,
      });
    });
});

// Post new part
router.post("/newpart/:id", upload.single("images"), async (req, res) => {
  try {
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    let newStoryPart = new Part({
      userId: req.body.userId,
      title: req.body.title,
      description: req.body.description,
      images: `${basePath}${fileName}`,
    });
    newStory = await newStoryPart.save();
    if (!newStoryPart) {
      res
        .status(404)
        .json({ status: false, error: "some unknown error occured" });
    }
    Story.findByIdAndUpdate(
      req.params.id,
      {
        $push: { parts: newStoryPart },
      },
      { new: true }
    )
      .then((data) => {
        res.status(200).json({
          status: true,
          message: data,
          option: "part has been added to story",
        });
      })
      .catch((err) => {
        res.status(400).json({ status: false, error: err.message });
      });
  } catch (err) {
    res.status(400).json({ status: false, error: err.message });
  }
});

// Rate part
router.get("/rate/:id", (req, res) => {
  Part.findByIdAndUpdate(req.params.id, { $inc: { rating: 1 } }, { new: true })
    .then((story) => {
      console.log(story);
      if (!story) {
        return res.status(404).json({ status: false, error: "Id not found" });
      }
      Story.updateOne(
        { "parts._id": story._id },
        { $inc: { "parts.$.ratings": 1 } },
        { new: true }
      )
        .then((data) => {
          console.log(data);
          Story.find({ "parts._id": story._id })
            .then((part) => {
              console.log(part);
              res.status(200).json({ status: true, message: part });
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      return res.status(400).json({ status: false, error: err });
    });
});

// update part

router.put("/update/:id", upload.single("images"), (req, res) => {
  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  Part.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        userId: req.body.userId,
        title: req.body.title,
        description: req.body.description,
        images: `${basePath}${fileName}`,
      },
    },
    { new: true }
  )
    .then((part) => {
      Story.updateOne(
        { "parts._id": part._id },
        {
          $set: {
            "parts.$.title": req.body.title,
            "parts.$.description": req.body.description,
            "parts.$.image": `${basePath}${fileName}`,
          },
        },
        { new: true }
      )
        .then((update) => {
          console.log(update);
          res.status(200).json({ status: true, updatedPart: part });
        })
        .catch((err) => {
          res.status(404).json({ status: false, error: err.message });
        });
    })
    .catch((err) => {
      res.status(404).json({ status: false, error: err.message });
    });
});

// Delete one part
router.delete(`/part/:id`, (req, res) => {
  Story.updateOne(
    { "parts._id": mongoose.Types.ObjectId(req.params.id) },
    {
      $pull: {
        parts: { _id: mongoose.Types.ObjectId(req.params.id) },
      },
    },
    { new: true }
  )
    .then((sucess) => {
      console.log(sucess);
    })
    .catch((err) => {
      console.log(err);
    });
  Part.findByIdAndRemove(req.params.id, {
    useFindAndModify: false,
  })
    .then((part) => {
      if (part) {
        return res
          .status(200)
          .json({ success: true, message: "the part has been deleted" });
      } else {
        return res.status(404).json({
          sucess: false,
          message: "part not found!",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
