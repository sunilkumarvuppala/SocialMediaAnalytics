$(document).ready(function(){
    var totalReach=0,tweetReq=10,popularPageLimit=5,tweetCount = 0,tweetTotalSentiment = 0;
    var uniUsers,totData,hashTag;
    var hashTagResult = {
            allTweets: [],
            uniqueUsers: [],
            totalReach: 0,
            topTweets: [],
            activityRatio: {
                original: 0,
                rts: 0,
                replies: 0
            },
            countries: {},
            mediaUrl: []
        };
    function reset(){
        tweetReq=10;
        popularPageLimit=5;
         hashTagResult = {
            allTweets: [],
            uniqueUsers: [],
            totalReach: 0,
            topTweets: [],
            activityRatio: {
                original: 0,
                rts: 0,
                replies: 0
            },
            countries: {},
            mediaUrl: []
        };
    }
    $("#searchForm").submit(function(e){
        e.preventDefault();
        var hashTag1=$("#hashsearch-input").val();
        hashTag=hashTag1.replace("#", "");
        if(hashTag!="" && hashTag!=null){
            $("#loader").fadeIn();
            $("#mainSearch").fadeOut();
            var url='/doSrch?q='+hashTag;
            getAllTweesAjx(url,[]); 
			$("#backDiv").show();	
        }else{
            alert("Enter a HashTag please.");
        }
    });
    function getAllTweesAjx(url,tweets){
        var newTweets=[];
        //'js/data.json'
        var percentage=((10-tweetReq)/10)*100;
        $("#percentage").html(percentage+"% loaded");
        $.getJSON(url,function(data){
                newTweets=data.Tweetdata;
				tweetCount += newTweets.statuses.length;
				tweetTotalSentiment += data.sentiment;
				//console.log("CurrentTotalSentiment ::"+data.sentiment+" ,CurrenttweetCount ::"+newTweets.statuses.length);
				//console.log("tweetTotalSentiment ::"+tweetTotalSentiment+" ,tweetCount ::"+tweetCount);
                if (newTweets.search_metadata && newTweets.search_metadata.next_results && --tweetReq !== 0) {
                    url='/doSrch'+newTweets.search_metadata.next_results;
                    getAllTweesAjx(url,tweets.concat(newTweets.statuses));
                } else {
                    if (newTweets.statuses !== undefined) {
                        hashTagResult.allTweets = tweets.concat(newTweets.statuses);
                        var popularUrl = '/doPopScrh?q=' + hashTag;
                        // get popular tweets
                        getPopularTweets(popularUrl, []);
                       // complete();
                    } else {
                       complete();
                    }
                }
            });
    }
    function getPopularTweets(url, tweets) {
            var newTweets = [],
                nextUrl = '/doPopScrh';
            $("#percentage").html("99% loaded");
            // ajax request to get set of tweets 'js/pda.json'
            $.getJSON(url,function(data){
                newTweets = data;
                // if next page available and page limit not reached get rest of tweets
                if (newTweets.search_metadata && --popularPageLimit !== 0 && newTweets.search_metadata.max_id!==0) {
                    nextUrl += '?since_id='+newTweets.search_metadata.max_id;
                    getPopularTweets(nextUrl, tweets.concat(newTweets.statuses));
                } else {
                    // else save the obtained tweet
                    var completePopular = tweets.concat(newTweets.statuses);
                    hashTagResult.popularTweets = completePopular.concat(hashTagResult.allTweets.slice(0));
                   complete();
                }
            });
        }
    function hideLoader(){
        $("#loader").fadeOut(function(){$("#dashboard").slideDown();});
    }
    function complete(){
        setTitle(hashTag);
        if (hashTagResult.allTweets.length === 0) {
            alert("couldnot load tweets, please try again in a few minutes..");
        }
		tweetCount=hashTagResult.allTweets.length;
		//console.log('In Complete tweetCount,tweetTotalSentiment::'+tweetCount+" ,"+tweetTotalSentiment);
		var sentiment='Neutral';
		var sentimentImage="/images/neutral.png";
		var avg = tweetTotalSentiment / tweetCount;
		if (avg > 0.5) { // happy
			sentiment="Excited";
			sentimentImage="/images/excited.png";
		}
		if (avg < -0.5) { // angry
			sentiment ="Angry";
			sentimentImage="/images/angry.png";
		}
		$('.feeling').text('Twitter is feeling '+ sentiment+ ' about ' +hashTag);
		$('#TweetersFeeling').html("<img src='"+sentimentImage+"' alt='"+sentiment+"' class='img-responsive center-block' style='width:100px;height:100px' />");
        hashTagResult.uniqueUsers = setUniqueUsers(hashTagResult.allTweets);
		
        setReach();
        
        setTopTwitters();
        
        setTopTweets();
        
        setActivityRatio();
        
        hashTagResult.fullLayout = setOptimalImage();
        
        buildTheBoard();
        
        hideLoader();
        //console.log(hashTagResult);
    };
    function setTitle(hashTag) {
        var $title = document.getElementById('hashTagTitle');
        $title.innerHTML = '#'+hashTag;
    }
    function setUniqueUsers(statusArr) {
        var statusLength = statusArr.length,
            uniqueUsers = [];
        // loop through the tweets obtained and count if unique
        for (var i = 0; i < statusLength; i++) {
            for (var j = 0; j < uniqueUsers.length; j++) {
                if (uniqueUsers[j].id === statusArr[i].user.id) {
                    break;
                }
            }
            if (j === uniqueUsers.length) {
                uniqueUsers.push(statusArr[i].user);
            }
        }
        // return all unique users
        return uniqueUsers;
    }
    function setReach() {
            var totalUsers = hashTagResult.uniqueUsers,
                userCount = totalUsers.length,
                followerCount = 0;
            // loop through all tweets and with user followers obtain the reach
            for (var i = 0; i < userCount; i++) {
                followerCount += totalUsers[i].followers_count;
            }
            // save it in for futute use
            hashTagResult.totalReach = followerCount;
        
    }
    function setTopTwitters() {
            // get unique users
            var users = setUniqueUsers(hashTagResult.popularTweets),
                topTwitters = [],
                limit = 8,
                userObj = {};
            // loop through each user and obtain name, handle and profile image
            for (var i = 0; i < limit; i++) {
                userObj = {};
                userObj.name = users[i].name;
                userObj.imgUrl = users[i].profile_image_url.replace(/(.+)(_normal)\.(jpg|jpeg|png|gif)$/, "$1.$3")
                userObj.handle = users[i].screen_name;

                topTwitters.push(userObj);
            }
            // save it in for futute use
            hashTagResult.topTwitters = topTwitters;
        }   
    function setTopTweets() {
            var limit = 10,
                topTweetsArr = [],
                tweets = hashTagResult.popularTweets;
            // get the limit
            limit = limit < tweets.length ? limit : tweets.length;
            // loop thorugh the tweet and obtain all info on top tweet
            for (var i = 0; i < limit; i++) {
                topTweetsArr.push({
                    tweet: tweets[i].text,
                    displayName: tweets[i].user.name,
                    handle: "@" + tweets[i].user.screen_name,
                    retweetCount: tweets[i].retweet_count,
                    createdAt: tweets[i].created_at,
                    imgUrl: tweets[i].user.profile_image_url,
                    tweetUrl: 'https://www.twitter.com/' + tweets[i].user.screen_name + '/status/' + tweets[i].id_str
                });
            }
            // save it in for futute use
            hashTagResult.topTweets = topTweetsArr;
        }
     function setActivityRatio() {
                // get all tweets
                var tweets = hashTagResult.allTweets,
                    tweetCount = tweets.length;

                // loop through all tweets and calculate the RT's original and replies
                for (var i = 0; i < tweetCount; i++) {
                    if (tweets[i].retweeted_status) {
                        hashTagResult.activityRatio.rts++;
                    } else if (tweets[i].in_reply_to_screen_name ||
                        tweets[i].in_reply_to_status_id ||
                        tweets[i].in_reply_to_user_id) {
                        hashTagResult.activityRatio.replies++;
                    } else {
                        hashTagResult.activityRatio.original++;
                    }
                }
            }
    function setOptimalImage() {
            // get all tweets and count of it
            var tweets = hashTagResult.popularTweets,
                tweetCount = tweets.length;
            var mediaUritemp=[];
            // loop through all tweets and find an optimal image
            for (var i = 0; i < tweetCount; i++) {
                if (tweets[i].entities.media) {
                    var media = tweets[i].entities.media;
                    for (var j = 0; j < media.length; j++) {
                        if (media[j].sizes.large.w >= 450) {
                            mediaUritemp.push(media[j].media_url);
                        }
                    }
                }
            }
        tweets = hashTagResult.allTweets;
        tweetCount = tweets.length;

            // loop through all tweets and find an optimal image
            for (var i = 0; i < tweetCount; i++) {
                if (tweets[i].entities.media) {
                    var media = tweets[i].entities.media;
                    for (var j = 0; j < media.length; j++) {
                        if (media[j].sizes.large.w >= 500) {
                            mediaUritemp.push(media[j].media_url);
                        }
                    }
                }
            }
            //console.log(mediaUritemp);
            if(mediaUritemp.length>0){
                hashTagResult.mediaUrl=mediaUritemp;
                return true;
            }
            else
                return false;
        }
    function buildTheBoard(){
        renderSlideShow();
        renderTopTwitters();
        renderDoChart();
        //reset();
    }
    function renderSlideShow(){
        if(hashTagResult.mediaUrl.length>0){
                $("#carInner").html('');
            for(i=0; i<hashTagResult.mediaUrl.length;i++){
                if(i==0){
                    $("#carInner").append('<div class="item active"><img src="'+hashTagResult.mediaUrl[i]+'" alt=""></div>');
                }else{
                    $("#carInner").append('<div class="item"><img src="'+hashTagResult.mediaUrl[i]+'" alt=""></div>');
                }   
            }
             $('#myCarousel').carousel();
        }else{
            $("#carInner").html('<div class="item"><img src="images/back1.jpg" alt=""></div>');
        }
    }
    function renderTopTwitters(){
       if(hashTagResult.topTwitters.length>0){
                $("#topTweeters").html('');
            for(i=0; i<hashTagResult.topTwitters.length;i++){
                $("#topTweeters").append('<div class="media block-update-card"><a target="_blank" href="https://www.twitter.com/'+hashTagResult.topTwitters[i].handle+'"><img class="media-object update-card-MDimentions" src="'+hashTagResult.topTwitters[i].imgUrl+'" alt="..."></a><h5 class="media-heading">'+hashTagResult.topTwitters[i].name+'</h5></div>'); 
            }
        }else{
            
        }
        $("#totalReach").html(hashTagResult.totalReach);
        $("#totalusers").html(hashTagResult.uniqueUsers.length);
        if(hashTagResult.topTweets.length>0){
            for(i=0; i<hashTagResult.topTweets.length;i++){
                $("#topList").append('<a target="_blank" href="'+hashTagResult.topTweets[i].tweetUrl+'" class="list-group-item">'+hashTagResult.topTweets[i].displayName+' :: '+hashTagResult.topTweets[i].tweet+'</a>'); 
            }
        }else{
        }
    }
    function renderDoChart(){
        var chart = new CanvasJS.Chart("chartContainer",
	{      
        backgroundColor:null,
		data: [
		{        
			type: "doughnut",
            
			startAngle: 20,                          
			toolTipContent: "{legendText}: {y} - <strong>#percent% </strong>", 					
			dataPoints: [
				{y: hashTagResult.activityRatio.original, indexLabel: "Original #percent%", legendText: "Original" },
				{y: hashTagResult.activityRatio.rts, indexLabel: "Retweets #percent%", legendText: "Retweets" },
				{y: hashTagResult.activityRatio.replies,  indexLabel: "Replies #percent%", legendText: "Replies" }			
			]
		}
		]
	});
	chart.render();
    }
});
