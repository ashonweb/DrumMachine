import React,{Component} from 'react'
export default class Drumlayout extends Component{
  
  constructor(props){
    super(props);
    this.state = {
      padstate:"inactiveStyle",
    }
   
  }
  render(){
    const data =  [{
      keyCode : 81,
      keyTrigger:'Q',
      id:"Heater-1",
      url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
  },
{
  keyCode : 90,
  keyTrigger:'Z',
  id:"rock-1",
  url:"bhagya/Basic_Rock_135.mp3"
},{
  keyCode : 67,
  keyTrigger:'C',
  id:"closedch",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Cev_H2.mp3"
},{
  keyCode : 68,
  keyTrigger:'D',
  id:"Heater-1",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Dsc_oh.mp3"
},
{
  keyCode : 90,
  keyTrigger:'Z',
  id:"rock-1",
  url:"bhagya/Basic_Rock_135.mp3"
},{
  keyCode : 67,
  keyTrigger:'C',
  id:"closedch",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Cev_H2.mp3"
},{
  keyCode : 68,
  keyTrigger:'D',
  id:"Heater-1",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Dsc_oh.mp3"
},
{
  keyCode : 90,
  keyTrigger:'Z',
  id:"rock-1",
  url:"bhagya/Basic_Rock_135.mp3"
},{
  keyCode : 67,
  keyTrigger:'C',
  id:"closedch",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Cev_H2.mp3"
},{
  keyCode : 68,
  keyTrigger:'D',
  id:"Heater-1",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Dsc_oh.mp3"
},
{
  keyCode : 81,
  keyTrigger:'Q',
  id:"Heater-1",
  url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
  },
  {
    keyCode : 81,
    keyTrigger:'Q',
    id:"Heater-1",
    url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
    },
    {
      keyCode : 81,
      keyTrigger:'Q',
      id:"Heater-1",
      url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
      },
      {
        keyCode : 81,
        keyTrigger:'Q',
        id:"Heater-1",
        url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
        },
{
keyCode : 81,
keyTrigger:'Q',
id:"Heater-1",
url:"https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
}]
    return(
      <div className="drum-pad">
      
     
      <div className="iactive">
      {data.map(function(value, id){
         return (
         <span className="value" key={id}>
         {value.keyTrigger}
         </span>
        )
       })}
      </div>
      

      
      </div>
     
    )
  }


}