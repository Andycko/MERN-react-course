const express = require("express");
const connectDB = require("./config/db");

const app = express();

// Connect database
connectDB();

app.get("/", (req, res) => res.send('API Running'));

// Define routes
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/profiles", require("./routes/api/profiles"));
app.use("/api/users", require("./routes/api/users"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {console.log(`Server listening on port ${PORT} *_*`)});

