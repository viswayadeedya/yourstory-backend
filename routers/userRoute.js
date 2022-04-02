const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Get Request

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});


router.get(`/:id`, (req, res) => {
  User.findById(req.params.id)
    .select("-passwordHash")
    .then((user) => {
      if (user) {
        res.status(200).send(user);
      } else {
        res.status(404).json({ message: "user not found" });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        message: "The user with the given id does not exist",
        error: err,
      });
    });
});

// Post Request
router.post(`/login`, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.SECRET;
    if (!user) {
      return res.status(400).send("The user not found");
    }
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: "1d" }
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: { user: user, token: token },
      });
    } else {
      res.status(404).send("password is wrong!");
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post(`/`, async (req, res) => {
  try {
    let user = new User({
      username: req.body.username,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
      works: req.body.works,
      about: req.body.about,
      following: req.body.following,
      followers: req.body.followers,
      dp: req.body.dp,
      cover: req.body.cover,
    });
    console.log(user);
    user = await user.save();
    if (!user) {
      return res.status(404).send("the user cannot be registered");
    }
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});

router.post(`/register`, async (req, res) => {
  try {
    let user = new User({
      username: req.body.username,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      works: req.body.works,
      about: req.body.about,
      following: req.body.following,
      followers: req.body.followers,
      dp: req.body.dp,
      cover: req.body.cover,
    });
    user = await user.save();

    if (!user) {
      return res.status(404).send("the user cannot be registered");
    }

    res.send(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Put Request

router.put(`/:id`, (req, res) => {
  var newPassword;
  User.findById(req.params.id)
    .then((userExists) => {
      if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10);
      } else {
        newPassword = userExists.passwordHash;
      }
      User.findByIdAndUpdate(
        req.params.id,
        {
          username: req.body.username,
          email: req.body.email,
          passwordHash: req.body.password,
          works: req.body.works,
          about: req.body.about,
          following: req.body.following,
          followers: req.body.followers,
          dp: req.body.dp,
          cover: req.body.cover,
        },
        { new: true }
      )
        .then((user) => {
          if (!user) {
            return res.status(404).json({ error: "Id not found" });
          }
          return res.send(user);
        })
        .catch((err) => {
          return res.status(400).json({ error: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// Delete Request

router.delete(`/:id`, (req, res) => {
  User.findByIdAndRemove(req.params.id, { useFindAndModify: false })
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user has been deleted" });
      } else {
        return res.status(404).json({
          sucess: false,
          message: "user not found!💀",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
