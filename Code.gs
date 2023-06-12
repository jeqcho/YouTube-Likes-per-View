// Note: Apps Script automatically requests authorization
// based on the API's used in the code.

function test(){
  // Tom Scott
  getAllVideos('UUBa659QWEk1AI4Tg--mrJ2A')
}

function clear_sheet(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // Clear the existing data
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Write the row of data (foo) to the first row
  var data = ["Link","Title","Duration","Views","Likes","Likes/View"];
  sheet.getRange(1, 1, 1, data.length).setValues([data]);
}

function getTopRatedFrom(){
  clear_sheet()
  var ui = SpreadsheetApp.getUi();
  var channelId = ui.prompt("Enter the channel ID\n(Go to About section of the channel, click the Share icon and \"Copy channel ID\"): ").getResponseText();
  var playlistId = "UU" + channelId.slice(2);
  getAllVideos(playlistId)
}

function getTopRatedFromPlaylist(){
  clear_sheet();
  var ui = SpreadsheetApp.getUi();
  var playlistId = ui.prompt("Enter the playlist ID: ").getResponseText();
  getAllVideos(playlistId)
}

function linkify(_id){
   return "https://youtube.com/watch?v=" + _id
}

function getAllVideos(playlistId){
  var token = "init"
  var response = []
  var ct = 0
  var videoIds = []
  var videoTitles = []
  var statResponse = []
  while(!!token){
    var res = processToken(token,playlistId)
    ct++
    Logger.log(ct*50/res.pageInfo.totalResults)
    response.push(res)
    token = res.nextPageToken
    vids = res.items.map(item=>item.snippet.resourceId.videoId)
    videoIds.push(...vids);
    videoTitles.push(...res.items.map(item=>item.snippet.title));
    statResponse.push(...YouTube.Videos.list(['statistics','contentDetails'],{'id':vids,'maxResults':50}).items)
  }

  var data = []
  for(var i=0;i<statResponse.length;++i){
    var item = statResponse[i]
    row = [linkify(videoIds[i]),videoTitles[i],item.contentDetails.duration,item.statistics.viewCount,item.statistics.likeCount,item.statistics.likeCount/item.statistics.viewCount]
    data.push(row)
  }
  data.sort((a, b) => b[b.length - 1]-a[a.length - 1]);
  SpreadsheetApp.getActiveSheet().getRange(2,1,data.length, data[0].length).setValues(data);
}

function processToken(token,playlistId){
  if(token=="init")return YouTube.PlaylistItems.list(['snippet'],
                                       {'playlistId': playlistId,'maxResults':50});
return YouTube.PlaylistItems.list(['snippet'],
                                       {'pageToken':token, 'playlistId': playlistId,'maxResults':50});
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Like-per-View Finder')
  .addItem('Get Top Rated from A Channel', 'getTopRatedFrom')
  .addItem('Get Top Rated from A Playlist', 'getTopRatedFromPlaylist')
  .addToUi();
}
