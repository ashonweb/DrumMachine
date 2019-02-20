import React,{Component} from 'react';
import Drumlayout from './Drumlayout';
export default class Layout extends Component{
  constructor(props){
    super(props);
    this.state = {
      isPower: false,
    }
  }

  handleKeyPress = (e) =>{
    if (e.keyCode === "Q") {
      console.log("sdajhdjh")
      this.playSound();
    }
  }

  // playSound = (e)  => {
  //   const sound = document.getElementById(this.props.id);
  //   console.log("play sound 1");
    
    
    
    
  // }

  powerbutton = () =>{
    // console.log(this.state.isPower)
   this.setState({
      isPower:!this.state.isPower,
   },() =>{ console.log(this.state.isPower)  })
  }

  render() {  
    return (
      <div className="layout">
        <label class="switch"  >
          <input type="checkbox" />
          <span className="slider round" onClick={this.powerbutton}  ></span>
         
        </label>
<div>
  <Drumlayout togglePlay = {this.togglePlay}/>
</div>
      </div>

    )
  }
}
