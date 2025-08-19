const mongoose = require("mongoose");

function initalizeDb() {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Atlas Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));
}

module.exports = { initalizeDb };
