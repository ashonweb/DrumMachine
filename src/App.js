import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import './responsive.css';
import Layout from './Layout';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p> Drum Machine</p>
        </header>
        <div>
          <Layout />
          
        </div>
      </div>
    );
  }
}

export default App;
