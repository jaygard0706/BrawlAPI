const { clientId, guildId, token, APIKEY} = require('./APIconfig.json');
const Discord = require('discord.js');
const fs = require('fs');
const https = require('https');
const fetch = require("node-fetch");
const client = new Discord.Client({ intents: [
  "GUILDS" ,
  "GUILD_MEMBERS" ,
  "GUILD_INTEGRATIONS" ,
  "GUILD_MESSAGES" ,
  "GUILD_MESSAGE_REACTIONS"] });

let url = `https://api.brawlhalla.com/rankings/rotating/us-e/1?api_key=${APIKEY}`;
oldFile = require('./APIOld.json');
newFile = require('./APINew.json');
playerLog = require('./APIPlayerLog.json');

client.once('ready', () => {
	console.log('Ready!');
  updateFiles2();
});



var checkminutes = 5,
   checkthe_interval = checkminutes * 60 * 1000; //This checks every x minutes, change 1 to whatever minute you'd like
setInterval(function() {
  try{
    updateFiles2();
    const oneMin = 60000;
    const oneHr = 60 * oneMin;

    var playersInQueue = [];
    var shouldPing = false;

    for(var i = 0 ; i < newFile.length ; i++){
      for(var j = 0 ; j < oldFile.length ; j++){
        if(newFile[i].brawlhalla_id == oldFile[j].brawlhalla_id){
          if(newFile[i].rating != oldFile[j].rating){
            for(var k = 0 ; k < playerLog.length ; k++){
              if(playerLog[k].brawlhalla_id == newFile[i].brawlhalla_id){
                playerLog[k].lastQueued = Math.floor(Date.now());
                playersInQueue.push(playerLog[k].brawlhalla_id);
                if( Math.floor(Date.now()) - playerLog[k].lastPinged > oneMin * 29.5){
                  shouldPing = true;
                }
                break;
              }
            }
          }
          break;
        }
      }
    }

    var s = "";
    if(shouldPing){
      minQueue = new Discord.MessageEmbed()
      	.setColor('#0099ff')
      	.setTitle('Users queued in the last minute')
      	//.setDescription('Some description here')
      	//.addField('Inline field title', 'Some value here', true);
        var num = 0;
      for(var j = 0 ; j < newFile.length ; j++){
        for(var i = 0 ; i < playersInQueue.length && num < 25; i++){
          if(playersInQueue[i] == newFile[j].brawlhalla_id){
            var oldIndex = 0;
            for(var k = 0 ; k < oldFile.length ; k++){
              if(oldFile[k].brawlhalla_id == newFile[j].brawlhalla_id){
                oldIndex = k;
                break;
              }
            }
            if(newFile[j].games - oldFile[oldIndex].games > 0){
              minQueue.addField(`**Rank ${newFile[j].rank}**`, `${newFile[j].name}: ${newFile[j].rating} **(${((newFile[j].rating < oldFile[oldIndex].rating) ? '-' : '+')} ${Math.abs(newFile[j].rating - oldFile[oldIndex].rating)})** \n+${newFile[j].games - oldFile[oldIndex].games} games`, true);
              num++;
            }

            //// TODO:
            //// Change lastPinged values for all pinged players
            break;
          }
        }
      }

      sendNA({ embeds: [minQueue] });
    }

    writeJSON('./APIPlayerLog', playerLog);
    //testLog('A minute has passed');
  }catch(e){
    testLog('<@422184269025247233> An error occurred in the update process');
    console.log(e)
  }
}, checkthe_interval);



client.login(token);

function updateFiles(){
  https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      data = JSON.parse(data);
      oldFile = newFile;
      writeJSON('./APIOld.json', newFile)
      newFile = data;
      writeJSON('./APINew.json', data)
      //console.log(data);
      for(var i = 0 ; i < newFile.length ; i++){
        var isInLog = false;
        for(var j = 0 ; j < playerLog.length ; j++){
          if(playerLog[j].brawlhalla_id == newFile[i].brawlhalla_id){
            isInLog = true;
            playerLog[j].name = newFile[i].name;
            playerLog[j].rating = newFile[i].rating;
            break;
          }
        }
        if(!isInLog){
          obj = {
            name: newFile[i].name,
            brawlhalla_id: newFile[i].brawlhalla_id,
            rating: newFile[i].rating,
            lastQueued: 0,
            lastPinged: 0
          }
          playerLog.push(obj);
        }
      }
      writeJSON('./APIPlayerLog.json', playerLog);
    })
  }).on('error', err => {
    console.log(err.message);
  }).end()
}

async function updateFiles2(){
  var data = [];
  const pages = 4;
  const region = 'us-e'
  for(var i = 0 ; i < pages ; i++){
    var n = await getLBPage(region, i + 1)
    for(var j = 0 ; j < n.length ; j++){
      data.push(n[j]);
    }
    //console.log(`-${data}`)
  }
  //console.log(`-${data}`);
  oldFile = newFile;
  writeJSON('./APIOld.json', newFile)
  newFile = data;
  writeJSON('./APINew.json', data)
  //console.log(data);
  for(var i = 0 ; i < newFile.length ; i++){
    var isInLog = false;
    for(var j = 0 ; j < playerLog.length ; j++){
      if(playerLog[j].brawlhalla_id == newFile[i].brawlhalla_id){
        isInLog = true;
        playerLog[j].name = newFile[i].name;
        playerLog[j].rating = newFile[i].rating;
        break;
      }
    }
    if(!isInLog){
      obj = {
        name: newFile[i].name,
        brawlhalla_id: newFile[i].brawlhalla_id,
        rating: newFile[i].rating,
        lastQueued: 0,
        lastPinged: 0
      }
      playerLog.push(obj);
    }
  }
  writeJSON('./APIPlayerLog.json', playerLog);
}

async function getLBPage(region, page){
  let d = await fetch(`https://api.brawlhalla.com/rankings/rotating/${region}/${page}?api_key=${APIKEY}`)
  var res = await d.json();
  //console.log(`-${res}`)
  return res;
  //console.log(`-${d}`);
  //return d;
}

async function testLog(a){
  client.guilds.cache.get(guildId).channels.cache.get('966923842180239434').send(a);
}

async function sendNA(a){
  client.guilds.cache.get(guildId).channels.cache.get('967239622293876846').send(a);
}

function writeJSON(filename, obj){
  fs.writeFile(filename, JSON.stringify(obj , null , 2) , err => {
    if (err) {
      console.error(err)
      return;
    }
  })
}
