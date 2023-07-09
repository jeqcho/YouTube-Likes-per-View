// Note: Apps Script automatically requests authorization
// based on the API's used in the code.

function test(){
  // Tom Scott
  // getAllVideos('UUBa659QWEk1AI4Tg--mrJ2A')
  getAllVideos('UU2Kyj04yISmHr1V-UlJz4eg') //Jared
}

function clear_sheet(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // Clear the existing data
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Write the row of data (foo) to the first row
  var data = ["Link","Title","Duration","Views","Likes","Likes/View","Score (regression deviation)"];
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
  let views = []
  let likes = []
  for(var i=0;i<statResponse.length;++i){
    var item = statResponse[i]
    let likeCount = item.statistics.likeCount
    let viewCount = item.statistics.viewCount
    let ltv = likeCount/viewCount
    if(!ltv)ltv = '';
    row = [linkify(videoIds[i]),
    videoTitles[i],
    item.contentDetails.duration,
    viewCount,
    likeCount?likeCount:-1,
    ltv]
    data.push(row)
    views.push(viewCount)
    likes.push(likeCount)
  }
  let scores = getScore(views,likes)
  for (let i = 0;i<data.length;++i){
    data[i].push(scores[i]?scores[i]:-Infinity)
  }
  // sort by regression error
  data.sort((a, b) => b[b.length-1]-a[a.length-1]);

  // replace infinities
  data = data.map(function(row){
    let v=row[row.length-1]; 
    row[row.length-1] = v==-Infinity ? '' : v;
    return row;})
  SpreadsheetApp.getActiveSheet().getRange(2,1,data.length, data[0].length).setValues(data);
}

function processToken(token,playlistId){
  if(token=="init")return YouTube.PlaylistItems.list(['snippet'],
                                       {'playlistId': playlistId,'maxResults':50});
return YouTube.PlaylistItems.list(['snippet'],
                                       {'pageToken':token, 'playlistId': playlistId,'maxResults':50});
}

function getScore(views,likes){
  let loggedViews = views.map(Math.log)
  let loggedLikes = likes.map(Math.log)
  var regression = getLinearRegression(loggedViews, loggedLikes);
  Logger.log("regression results")
  Logger.log(regression)

  // Get the regression results
  var slope = regression[0]
  var intercept = regression[1]

  let scores = []
  for(let i = 0; i< loggedLikes.length; i++){
    let diff = loggedLikes[i] - (slope * loggedViews[i] + intercept)
    let score = diff*diff
    if (diff<0)score=-score
    scores.push(score)
  }
  Logger.log("scores")
  Logger.log(scores)
  return scores;
}

function getLinearRegression(x,y){
  Logger.log("Received data")
  Logger.log(x)
  Logger.log(y)

  let sumY = 0;
  let sumX = 0;
  let sumXY = 0;
  let sumXSquared = 0;

  for (let i = 0; i < y.length; i++) {
    if(!x[i] || !y[i] || x[i]==-Infinity|| y[i]==-Infinity)continue; // skip entries with NaN (zero views or likes)
    sumY += y[i];
    sumX += x[i];
    sumXY += y[i] * x[i];
    sumXSquared += x[i] * x[i];
  }

  // Calculate the means
  const meanY = sumY / y.length;
  const meanX = sumX / x.length;

  Logger.log([sumX,sumY,sumXY,sumXSquared,meanY,meanX])

  // Calculate the slope (b) and the y-intercept (a) of the best-fit line
  const slope = (sumXY - y.length * meanY * meanX) /
    (sumXSquared - x.length * meanX * meanX);
  const xIntercept = meanY - slope * meanX;
  return [slope,xIntercept]
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Like-per-View Finder')
  .addItem('Get Top Rated from Channel', 'getTopRatedFrom')
  .addItem('Get Top Rated from Playlist', 'getTopRatedFromPlaylist')
  .addToUi();
}
