const express = require('express');
const app = express();
require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const errorHandler = require('./middlewares/error-handler');
const notFound = require('./middlewares/not-found');
const dbConnect = require('./db/connect');

// Route imports
const userRouter = require('./routes/user');
const resourceProtectedRouter = require('./routes/resource-protected');
const resourcePublicRouter = require('./routes/resource-public');
const chatRouter = require('./routes/chat');
const quizRouter = require('./routes/quiz');
const bookmarkRouter = require('./routes/bookmark');
const analyticsRouter = require('./routes/analytics');
const studyGroupRouter = require('./routes/studyGroup');
const profileRouter = require('./routes/profile');

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/resources/protected', resourceProtectedRouter);
app.use('/api/v1/resources/public', resourcePublicRouter);
app.use('/api/v1/auth', userRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/quiz', quizRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/groups', studyGroupRouter);
app.use('/api/v1/profile', profileRouter);

app.get('/',(req,res)=>{
    res.status(200).send('Study Vault API v2.0');
})

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not set in environment variables');
    }
    await dbConnect(process.env.MONGO_URI);
    console.log('DB connected');
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();