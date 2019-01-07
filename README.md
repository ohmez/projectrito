# Welcome To My Rito

## About Us

We're league enthusiasts with a passion for web development. 
We want to provide our fellow players with quick web/mobile access to their profile.
Our goal is to provide you with smooth access to your summoner information.
As well as providing usefull insights into statistics and identify opportunities for improving your gameplay.

### Index
[Developer Section](#Developer-Section)



### Developer-Section

#### Front-End

`handlebars`, `html5-up`, `css`, `jquery`

#### Back-End

`express`, `node`, `request`, `dotenv`

#### Process

We start by building the summoner object in the `htmlRoutes.js` file.
This `sum` object will be created for any summoner name that is searched.
We have to iterate through multiple static API routes in order to gather all the information we're looking to have.
Each API call adds child keys to the `sum` object to allow for smooth DOM population.

#### Issues

1. The API calls give us a lot of data; this has proven a challenge to convert the responses into SQL formatted storage.
	1.a - Solution = We're going to build up the summoner object as much as possible then store it in JSON format.
2. The dynamic nature of each individual summoner profile.
	1.a - Solution = Handlebars `if` & `each` statements are our savior.





