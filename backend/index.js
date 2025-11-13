// 1. Import dependencies
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// 2. Load environment variables 
dotenv.config();

// 3. Create Express app
const app = express();

// 4. Middleware
app.use(cors());
app.use(express.json()); // สำหรับรับ JSON body

// 5. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
