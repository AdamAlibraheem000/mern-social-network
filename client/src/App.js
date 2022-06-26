import React, {Fragment} from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';
import  Login  from './components/auth/Login';
import  Register  from './components/auth/Register';
import './App.css';
// Redux
import { Provider } from 'react-redux';
import store from './store';

const App = () => (
<Provider store={store}>
<Router>
<Fragment>
  <Navbar></Navbar>
  <Routes>
  <Route  path='/' element={<Landing/>}></Route>
  </Routes>
  <section className='container'>
    <Routes>
      <Route  path="/register" element={<Register/>} ></Route>
      <Route  path="/login" element={<Login/>} ></Route>
    </Routes>
  </section>
</Fragment>
</Router>
</Provider>
);

export default App;
