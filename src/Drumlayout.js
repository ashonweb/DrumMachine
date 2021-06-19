import React,{Component} from 'react';
export default class Drumlayout extends Component {

  constructor(props) {
    super(props);
    this.state = {
      play: false,
      open:false,
      key:''
    }
    this.data = [{
      keyCode: 81,
      keyTrigger: 'Q',
      id: "Heater-1",
      url: "https://audio-previews.elements.envatousercontent.com/files/278274449/preview.mp3"
    },
    {
      keyCode: 90,
      keyTrigger: 'Z',
      id: "chord3",
      url: "https://audio-previews.elements.envatousercontent.com/files/227188580/preview.mp3"
    },
     {
      keyCode: 67,
      keyTrigger: 'C',
      id: "cev",
      url: "https://audio-previews.elements.envatousercontent.com/files/111293649/preview.mp3"
    }, {
      keyCode: 69,
      keyTrigger: 'E',
      id: "kick",
      url: "https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
    },
    {
      keyCode: 86,
      keyTrigger: 'V',
      id: "rock-1bnk",
      url: "https://audio-previews.elements.envatousercontent.com/files/336815651/preview.mp3"
    }, {
      keyCode: 77,
      keyTrigger: 'M',
      id: "bld",
      url: "https://audio-previews.elements.envatousercontent.com/files/146921993/preview.mp3"
    }, {
      keyCode: 80,
      keyTrigger: 'P',
      id: "Heater-6",
      url: "https://audio-previews.elements.envatousercontent.com/files/241826319/preview.mp3"
    },
    {
      keyCode: 75,
      keyTrigger: 'K',
      id: "rock-1",
      url: "https://s3.amazonaws.com/freecodecamp/drums/Chord_2.mp3"
    }, {
      keyCode: 65,
      keyTrigger: 'A',
      id: "closedch",
      url: "https://audio-previews.elements.envatousercontent.com/files/297959886/preview.mp3"
    }, {
      keyCode: 71,
      keyTrigger: 'G',
      id: "Heater-1",
      url: "https://audio-previews.elements.envatousercontent.com/files/145775942/preview.mp3"
    }]
    this.audio = new Audio(this.data[0].url)


  }

  handleClick = (index,key) =>{
    // console.log(index);
    this.audio.pause();
  this.audio = new Audio(this.data[index].url)

    this.audio.play();
    this.audio.onplaying = (e) => {
      this.setState({
        open:true,
        key:key
      },()=>{
        console.log(this.state.open)
      })
    }
    this.audio.onended = (e) => {
      this.setState({
        open:false,
        key:''
      },()=>{
        console.log(this.state.open)
      })
    }
    
    console.log(this.audio);

  }
  render(){
   
    return(
      <div className="drum-pad">
        <div className="iactive">
        {this.data.map((value, index) => {
          // console.log("The current iteration is: " + index);
          return (
            <div className="value" style={{background:(this.state.open===true && this.state.key===value.keyTrigger) ? "green" :"",color:(this.state.open===true && this.state.key===value.keyTrigger) ? "white" :"black",}}  key={index} id={value.id}  onClick={() => this.handleClick(index,value.keyTrigger)}  >
              {value.keyTrigger}
            </div>
          )
        })}
        </div>
      </div>

    )
  }


}