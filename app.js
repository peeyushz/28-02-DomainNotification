const express = require('express');
const mongoSanitize = require("express-mongo-sanitize")
const bodyparser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const connectDB = require('./server/database/dbConnection');


const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080

connectDB()
const cronJob = require("./server/controller/crons/alertsCron").exec
const gracePeriodJob = require("./server/controller/crons/gracePriodCron").exec

// support parsing of application/json type post data
app.use(bodyparser.json({
    verify: (req, res, buf, encoding) => {
        // get rawBody
        req.rawBody = buf.toString()
    }
}));
// parse request to body-parser
app.use(bodyparser.urlencoded({ extended: true }))


app.use('/', require('./server/routes/router'));




app.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`) });