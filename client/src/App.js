import React, {Fragment} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import './App.css';
// Redux
import { Provider } from 'react-redux';
import store from './store';

const App = () => 
<Provider store={store}>
<Router>
<Fragment>
  <Navbar></Navbar>
  <Routes>
    <Route path="/" element={<Landing/>}></Route>
      <Route className="container" path="/login" element={<Login/>}></Route>
      <Route className="container" path="/register" element={<Register/>}></Route>
  </Routes>
</Fragment>
</Router>
</Provider>
  

export default App;
