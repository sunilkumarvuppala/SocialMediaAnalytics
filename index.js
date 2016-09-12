var express = require('express'),
    app = express(),
	sentiment = require('sentiment'),
    Twitter=require('twitter'),
    server = require('http').createServer(app);
var port =Number(process.env.PORT || 3000)
server.listen(port);
var TweetSentimentscore =0;
app.set('json spaces', 0);
var jsonminify = require("jsonminify");

var client = new Twitter({
    consumer_key:'kpmNb1q7NhPMfGPMJkx8i0R92',
    consumer_secret:'BF2bNVZoVP3InqtLZJUzfcUSKXHoi0b8sppb0S0adGQzDq1ajR',
    access_token_key:'225760593-6dihot17Fja2ZNYhbIkC3mJjlQZh5WDWHxd8gYLf',
    access_token_secret:'lEIrtYlqLJwZU4KAMMGSpIcqrLJfwVFunmfiqWLhGv8Gj'
});


app.use(express.static('public'));

app.set('view engine','ejs')



app.get('/',function(req, res){
    var TrendingTweets=[];
    //23424977
    client.get('trends/place',{id:1},function(error, data){
       //console.log(error);
       // if(error) throw error;
        for(k in data){
        var l=data[k].trends
           for(i in l){
                TrendingTweets.push(l[i].name);
            }
        }
        res.render('default',{trends:TrendingTweets});
    }); 
});

app.get('/doSrch',function(req, res){
    /*var testJson = require('./data.json');
    res.send(testJson);*/
   if(req.query.q!=null){
       if(req.query.max_id!=null){
            //console.log("in not null");
            client.get('search/tweets', {q:req.query.q,count:100,max_id:req.query.max_id,result_type:'recent'},function(error, twees, response){
               // if(error) throw error;
                jsonminify(twees);
				for (i = 0; i < twees.statuses.length; i++) { 
					sentiment(twees.statuses[i].text, function (err, result) {
                            TweetSentimentscore += result.score;
                        });
				}
				res.send({Tweetdata: twees, sentiment: TweetSentimentscore});
				//res.send(twees);
				
            });
       }else{
           //console.log("in null");
        client.get('search/tweets', {q:req.query.q,count:100,result_type:'recent'},function(error, twees, response){
           // if(error) throw error;
             jsonminify(twees);
			 for (i = 0; i < twees.statuses.length; i++) { 
					sentiment(twees.statuses[i].text, function (err, result) {
                            TweetSentimentscore += result.score;
                        });
				}
		    res.send({Tweetdata: twees, sentiment: TweetSentimentscore});
			//res.send(twees);
        }); 
       }
    }
});

app.get('/doPopScrh',function(req, res){
   if(req.query.q!=null){
       if(req.query.since_id!=null){
        client.get('search/tweets', {q:req.query.q,count:100,max_id:req.query.since_id,result_type:'popular'},function(error, twees, response){
            //if(error) throw error;
            res.send(twees);
        });
       }else{
        client.get('search/tweets', {q:req.query.q,count:100,result_type:'popular'},function(error, twees, response){
            //if(error) throw error;
            res.send(twees);
        }); 
       }
    }
});

app.get('*',function(req, res){
    
    res.send("Page not found");
});
