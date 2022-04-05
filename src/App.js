import React, { useState } from 'react';
import './App.css';
// import LogRocket from 'logrocket';


import Viewer from './Viewer/';



import Modal from './components/Modal'


// LogRocket.init('59lkkw/beto');



export default function App() {

  const [show, setShow] = useState(false);


  return (
    <div className="App">


      <Modal title="My Modal" onClose={() => setShow(false)} show={show} />

      <Viewer onClose={() => setShow(true)} />
    </div>
  );
}