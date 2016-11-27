//--------------------------------------------------
// Rock,Paper Scissors multi-player using Firebase
// 9/20/2016 RJF
//--------------------------------------------------
/* --- Design thought process ---
  1) Layout multi-player HMTL5
  2) Setup the Firebase DB
  3) Stitch UI, Code and Firebase events together
*/
var fireRPSRef = null;
//var firebase = null;
var provider = null;

var iAmPlayer = null;  //either 1 or 2 
var myName = null;

var player1name = null;
var player1choice = null;
var p1obj = null;  //the actual html element that was clicked (i.e. <img id=rock...)
var p1wins = 0;
var p1losses = 0;

var player2name = null;
var p2obj = null;  //the actual html element that was clicked (i.e. <img id=rock...)
var player2choice = null;
var p2wins = 0;
var p2losses = 0;

var uniqueHash = null;

//******** Main Section ************************
 var config = {
        apiKey: "AIzaSyBBgRfEqIpmwcFdcG-QgyxgLgsN8-BMAz8",
        authDomain: "rpsgame-45ca4.firebaseapp.com",
        databaseURL: "https://rpsgame-45ca4.firebaseio.com"
      };


      firebase.initializeApp(config);

      initApp = function() {
        
        firebase.auth().onAuthStateChanged(function(user) {
          if (user) {
            
            // User is signed in.
            var displayName = user.displayName;
            myName = displayName;
            console.log(myName);
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var uid = user.uid;
            var providerData = user.providerData;

            startGame(user);
           
          } else {

           // User is signed out.
           
          }
        }, function(error) {
          console.log(error);
        });
      };

      window.addEventListener('load', function() {
         initApp()
      });
//***********************************************

var database = firebase.database();


function startGame(user)
{
    console.log("Starting Game...");

    console.log("html iAmplayer = " + $(thisPlayerNumber).html() );

    if($(thisPlayerNumber).html() == "1" || $(thisPlayerNumber).html() == "2")
      return;

    fireRPSRef = getDBRef();
    
    setupHandlers();
      
 
    if (iAmPlayer==1){
        console.log("iamplayer 1");
        savePlayerToFB(user.displayName, 1);  
        document.getElementById('p1SignOut').addEventListener('click', signOut, false);
     }
     if (iAmPlayer==2)
     {
         savePlayerToFB(user.displayName, 2);  
         document.getElementById('p1SignOut').addEventListener('click', signOut, false);
      }
}


function savePlayerToFB(playerName, playerNumber)  
{
  var ref = fireRPSRef.child("Players/" + playerNumber);

  var newPlayer = {
      name:  playerName,
      wins: 0,
      losses: 0,
      choice: ""
    }

    ref.set(newPlayer);
}

 // Helper to get hash from end of URL or generate a random one.
function getDBRef() {
      var ref = firebase.database().ref();
      var currURL;

      var hash = window.location.hash.replace(/#/g, '');
      

      if (hash) //if there is already a hashkey, you were brought to the game as "player 2"
      {
          console.log("hash was already there! " + hash);
          ref = ref.child(hash);
          uniqueHash = hash;
          $(thisPlayerNumber).html("2");
          iAmPlayer = 2;
      } 
      else {
        // if you are creating a hash key in Firebase, you must be the first player
        ref = ref.push(); // generate unique location.
        window.location = window.location + '#' + ref.key; // add it as a hash to the URL.
        uniqueHash = '#' + ref.key;
        $(thisPlayerNumber).html("1");
        console.log($(thisPlayerNumber).html() + "?");
        iAmPlayer = 1;
      }
      
      if (typeof console !== 'undefined') {
         console.log('Firebase data: ', ref.toString());
      }


      var t = window.location.protocol + "//" + window.location.host + "/index.html#" + ref.key;
      console.log("t=" + t);

     /*
      var m = getMobileOperatingSystem();
      console.log(m);
      if (m == "iOS"){
          $('#url').addClass("hidden");
          $(mobileURLDiv).html("<a href='" + t + "'>" + t + "</a>");
          $(mobileURLDiv).removeClass("hidden");
        }
      else
     */     

      $('#url').val(t);
     
      return ref;
}


function signOut(){
    firebase.auth().signOut().then(function() {
        console.log("signed out!");
        window.location.href = "index.html";
      }, function(error) {
          console.log("Error: not signed out!");
      });
}



function setupHandlers(){
          //  =====  For when the players 1, 2 are added  =======
            var player_ref = fireRPSRef.child("Players");
            player_ref.on("child_added", function(snapshot) {
               snapshot.forEach(function(childSnapshot) {
                  if(childSnapshot.key == "name" && snapshot.key == 1){
                      console.log(childSnapshot.key + ":" + childSnapshot.val());
                      $(currentP1User).html(childSnapshot.val() + " is player 1");
                      player1name = childSnapshot.val();
                      
                    }
                   if(childSnapshot.key == "name" && snapshot.key == 2){
                      console.log(childSnapshot.key + ":" + childSnapshot.val());
                      $(currentP2User).html(childSnapshot.val() + " is player 2");
                      player2name = childSnapshot.val();

                      $(shareBox).addClass("hidden");    //hide invites, someone is here
                      $(chatDiv).removeClass("hidden");  //show Chat section since Player 2 joined
                      updateDataField("Players/turn", 1);  //create the 'turn' field since Player 2 joined
                    }
                });
              });


             var turn_ref = fireRPSRef.child("Players/turn");
             turn_ref.on('value', function(dataSnapshot) {
                  var turn = dataSnapshot.val();
                  togglePlayer(turn);
              }); 

             var choice1_ref = fireRPSRef.child("Players/1/choice");
             choice1_ref.on('value', function(dataSnapshot) {
                  var choice = dataSnapshot.val();
                  if(choice)
                  {
                    player1choice = choice;
                    updateDataField("Players/turn", 2);
                  }
                  
              });

             var choice2_ref = fireRPSRef.child("Players/2/choice");
             choice2_ref.on('value', function(dataSnapshot) {
                  var choice = dataSnapshot.val();
                  if(choice)
                  {
                      player2choice = choice;
                      checkWinner();
                      togglePlayer(1);
                  }
              });

             fireRPSRef.child("Players/Chat").on("child_added", function(snapshot) {
                     $('#chatText').append(snapshot.val() + '&#xA;');
                     playSound("pop.wav");
                });
}



function updateDataField(path, val){
  var ref = fireRPSRef.child(path);
  ref.set(val);
}

function togglePlayer(turn){
        
        if(turn==1)
        {
           if(iAmPlayer==1)
           {
                 $(p1Instructions).html("It's your turn. Please select a weapon");
                 $(p2Instructions).html("");
                 $(p1Weapon).removeClass("avoid-clicks");
                 $(p2Weapon).addClass("avoid-clicks");
           }
           if(iAmPlayer==2)
           {
                 $(p1Instructions).html("");
                 $(p2Instructions).html("Waiting for player 1 to choose.");
                 $(p1Weapon).addClass("avoid-clicks");
                 $(p2Weapon).addClass("avoid-clicks");
           }
        }

        if(turn==2)
        {
           if(iAmPlayer==1)
           {
                 $(p1Instructions).html("Waiting for player 2 to choose.");
                 $(p2Instructions).html("");
                 $(p1Weapon).addClass("avoid-clicks");
                 $(p2Weapon).addClass("avoid-clicks");
           }
           if(iAmPlayer==2)
           {
                 $(p1Instructions).html("");
                 $(p2Instructions).html("It's your turn.  Please select a weapon.");
                 $(p2Weapon).removeClass("avoid-clicks");
                 $(p1Weapon).addClass("avoid-clicks");
           }
        }
}

function playSound(soundfile){
  if(!soundfile)
    return;

    var audio = new Audio("assets/sounds/" + soundfile);
    audio.play();

}

function updateScore(winner, loser)
{
  if(winner=="p1")
  {
      if($(thisPlayerNumber).html() == "1")
          playSound("win.wav");
      else
           playSound("lose.wav");

      $(resultsText).html(player1name + " wins! " + player1choice + " beats " + player2choice);
  }
  else
  {
    if($(thisPlayerNumber).html() == "2")
          playSound("win.wav");
      else
          playSound("lose.wav");

      $(resultsText).html(player2name + " wins! " + player2choice + " beats " + player1choice);
  }
  
 $(p1score).html("Wins: " + p1wins + "   Losses: " + p1losses);
 $(p2score).html("Wins: " + p2wins + "   Losses: " + p2losses);
}


function showWinImages(winPlayer, winImg, loseImg)
{
   console.log(winPlayer + "," + winImg + "," + loseImg);

   if (winPlayer=="p1"){
      $('#p1Weapon .' + winImg).attr("src", "assets/images/" + winImg + "-gr.png");
      $('#p2Weapon .' + loseImg).attr("src", "assets/images/" + loseImg + "-rd.png");
    }
   if (winPlayer=="p2"){
      $('#p2Weapon .' + winImg).attr("src", "assets/images/" + winImg + "-gr.png");   
      $('#p1Weapon .' + loseImg).attr("src", "assets/images/" + loseImg + "-rd.png");
    }
    if (winPlayer=="tie"){
      $('#p2Weapon .' + winImg).attr("src", "assets/images/" + winImg + "-gr.png");   
      $('#p1Weapon .' + loseImg).attr("src", "assets/images/" + loseImg + "-gr.png");
    }
}
function checkWinner()
{
  var winner;

  if(player1choice == player2choice)
  {
    $(resultsText).html("Tie Game!");
    showWinImages("tie", player1choice.toLowerCase(), player2choice.toLowerCase());
    
  }
  
  if(player1choice=="Rock" && player2choice=="Paper")
       winner="p2";
  if(player1choice=="Rock" && player2choice=="Scissors")
       winner="p1";
  if(player1choice=="Paper" && player2choice=="Rock")
      winner="p1";  
  if(player1choice=="Paper" && player2choice=="Scissors")
     winner="p2";
  if(player1choice=="Scissors" && player2choice=="Paper")
      winner="p1";
  if(player1choice=="Scissors" && player2choice=="Rock")
     winner="p2";
  
  if(winner=="p1")
    {
      showWinImages("p1", player1choice.toLowerCase(), player2choice.toLowerCase());
      p1wins++;
      p2losses++;
      updateScore("p1", "p2");

      updateDataField("Players/1/wins", p1wins);
      updateDataField("Players/2/losses", p2losses);
    }
    if(winner=="p2")
    {
      showWinImages("p2", player2choice.toLowerCase(), player1choice.toLowerCase());
     p2wins++;
      p1losses++;
      updateScore("p2", "p1");
      updateDataField("Players/2/wins", p2wins);
      updateDataField("Players/1/losses", p1losses);
    }

   setTimeout(function(){
        resetGame();
    }, 6000); 
}



function resetGame()
{
  $("#player1-div").removeClass("disableDiv");
  $("#player2-div").removeClass("disableDiv");
   
  $("[id^=Rock]").attr("src", "assets/images/rock.png"); 
  $("[id^=Paper]").attr("src", "assets/images/paper.png"); 
  $("[id^=Scissors]").attr("src", "assets/images/scissors.png"); 
  $(p1Instructions).html("");
  $(p2Instructions).html("");
  $(resultsText).html("&nbsp;");
  updateDataField("Players/2/choice", "");
  updateDataField("Players/1/choice", "");
  updateDataField("Players/turn", "1");
  
}

$(document).on('click', '#p1Weapon', function(event){
   player1choice = event.target.id;
   
   p1obj = event.target;  //event.target.src = "assets/images/rock-rd.png";
   
    playSound(player1choice.toLowerCase() + ".wav");

   $(p1obj).attr("src", "assets/images/" + player1choice.toLowerCase() + "-gr.png"); 

   updateDataField("Players/1/choice", player1choice);

});

$(document).on('click', '#p2Weapon', function(event){
   player2choice = event.target.id;
   p2obj = event.target;
   
   playSound(player2choice.toLowerCase() + ".wav");

   $(p2obj).attr("src", "assets/images/" + player2choice.toLowerCase() + "-gr.png"); 

   updateDataField("Players/2/choice", player2choice);
});


//Chat function
$(document).on('click', '#sendText', function(){
  var str = $('#textMessage').val();
  console.log("textmsg: " + myName);
  var chat_ref = fireRPSRef.child("Players/Chat").push(myName + ": " + str);
  $('#textMessage').val('');

  
});

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}




