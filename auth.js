 // Client ID and API key from the Developer Console
  var CLIENT_ID = '345963167634-mmt0r328jn55opimaohq40gv6n84jujr.apps.googleusercontent.com';
  var API_KEY = 'AIzaSyD-M_Lea1XV50j9W-l-imROGhwcoxfsUFg';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function() {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    readData();
  } else {
    
    $("#auth").dialog({
      closeOnEscape:false,
      open:function(ev,ui){
        //Hide the little x close icon
        $(".ui-dialog-titlebar-close", ui.dialog).hide();
      },
      buttons:{Authorize:function(){handleAuthClick();$( this ).dialog( "close" );},Logout:function(){handleSignoutClick();$( this ).dialog( "close" );}}
    });
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}