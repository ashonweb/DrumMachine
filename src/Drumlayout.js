import React,{Component} from 'react';
export default class Drumlayout extends Component {

  constructor(props) {
    super(props);
    this.state = {
      play: false
    }
    this.data = [{
      keyCode: 81,
      keyTrigger: 'Q',
      id: "Heater-1",
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum2.mp3"
    },
    {
      keyCode: 90,
      keyTrigger: 'Z',
      id: "chord3",
      url: "https://s3.amazonaws.com/freecodecamp/drums/Chord_3.mp3"
    },
     {
      keyCode: 67,
      keyTrigger: 'C',
      id: "cev",
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum8.mp3"
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
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum7.mp3"
    }, {
      keyCode: 77,
      keyTrigger: 'M',
      id: "bld",
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum12.mp3"
    }, {
      keyCode: 80,
      keyTrigger: 'P',
      id: "Heater-6",
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum10.mp3"
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
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum5.mp3"
    }, {
      keyCode: 71,
      keyTrigger: 'G',
      id: "Heater-1",
      url: "http://audiosoundclips.com/wp-content/uploads/2011/12/Drum9.mp3"
    }]
    this.audio = new Audio(this.data[0].url)


  }

  handleClick = (index) =>{
    // console.log(index);
    this.audio.pause();
  this.audio = new Audio(this.data[index].url)
    this.audio.play();
    console.log(this.audio);

  }
  render(){
   
    return(
      <div className="drum-pad">
        <div className="iactive">
        {this.data.map((value, index) => {
          // console.log("The current iteration is: " + index);
          return (
            <span className="value" key={index} id={value.id}  onClick={() => this.handleClick(index)}  >
              {value.keyTrigger}
            </span>
          )
        })}
        </div>
      </div>

    )
  }


}