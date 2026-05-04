import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Components/Layout';
import GetMyResources from './Components/GetMyResources';
import CreateResource from './Components/CreateResource';
import GetAllResources from './Components/GetAllResources';
import GetAResource from './Components/GetAResource';
import Home from './Components/Home';
import Login from './Components/Login';
import Register from './Components/Register';
import UpdateMyResource from './Components/UpdateMyResource';
import QuizMode from './Components/QuizMode';
import Dashboard from './Components/Dashboard';
import Bookmarks from './Components/Bookmarks';
import Profile from './Components/Profile';
import Leaderboard from './Components/Leaderboard';
import StudyGroups from './Components/StudyGroups';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />} >
          <Route index element={<Home />} />
          <Route path="/getAllResources" element={<GetAllResources />} />
          <Route path="/getMyResources" element={<GetMyResources />} />
          <Route path="/createResource" element={<CreateResource />} />
          <Route path="/resource/:id" element={<GetAResource />} />
          <Route path="/update-resource/:id" element={<UpdateMyResource />} />
          <Route path="/quiz/:resourceId" element={<QuizMode />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/groups" element={<StudyGroups />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )
}

export default App;