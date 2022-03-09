const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
const usersRoutes = require("./routers/userRoute");
const storyRoutes = require("./routers/storyRoute");
const partsRoutes = require("./routers/partsRoute");
require("dotenv/config");

const Story = require("./models/story");

const api = process.env.API_URL;
const app = express();

app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use(authJwt());
app.use(morgan("tiny"));
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/stories`, storyRoutes);
app.use(`${api}/newstory`, partsRoutes);

mongoose
  .connect(process.env.DATABASE_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "yourstory-database",
  })
  .then(() => {
    console.log("Database connection is established");
  })
  .catch((err) => console.error(err));

app.listen(3000, () => {
  console.log("server is listening on port 3000");
});
