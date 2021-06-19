import React, { Component } from 'react';
import './App.css';
import './responsive.css';
import Drumlayout from './Drumlayout'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p> Drum Machine</p>
        </header>
        <div>
          <Drumlayout/>
          
        </div>
      </div>
    );
  }
}

export default App;
