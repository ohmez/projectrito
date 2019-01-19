# Welcome To My Rito
![HomePage](./images/home.PNG)

## About Us

We're league enthusiasts with a passion for web development. 
We want to provide our fellow players with quick web/mobile access to their profile.
Our goal is to provide you with quick access to your summoner information.
As well as providing usefull insights into statistics and identify opportunities for improving your gameplay.

### Index
[Developer Section](#Developer-Section)

[Issues](#Issues)

[Examples](#Examples)

### Examples

![HomePage](./images/home.PNG)

![Profile](./images/profile_landing.PNG)

![Ranked](./images/Ranked_Section.PNG)

![Mastery](./images/Mastery_Section.PNG)

![Match History](./images/Matches_Section.PNG)

### Developer-Section

#### Front-End Technologies

`express-handlebars`, `html5-up`, `css`, `jquery`

#### Back-End Technologies

`express`, `node`, `request`, `dotenv`

#### How To Help

If you're interested in helping or utilizing a local version you'll need to `clone` the repo and get your own API key from [Riot Developer](https://developer.riotgames.com/getting-started.html)
This requires a league of legends login currently so if you don't have one then start playing league of legends!
Once you have your API key and this repo cloned you'll need to use `node` and install the required `npm modules`.
Inside node where you cloned the repo `cd projectrito` then inside node `npm install`.
You'll then need to create a `.env` file and store your API key `RIOT_ID=Your_API_KEY`.
Once you do that you can launch a local version from node by using the command `node server`.

#### Process

The user will provide a summoner name which will search our database and if no summoner is found it will triger the first API request. 
All consecutive API requests after require results from the initial API request.
We start by building the summoner object in the `htmlRoutes.js` file.
This `sum` object will be created for any summoner name that is searched.
We have to iterate through multiple static API routes in order to gather all the information we're looking to have.
Each API call adds child keys to the `sum` object to allow for simple DOM population through handlebars.
Once the API chain has completed the page will render the summoners profile page and store thier information into our database.
If our database has been updated within 10 minutes it will not perform an API request upon refresh or re-searching the summoner name. 



#### Issues

1. The API calls give us a lot of data; this has proven a challenge to convert the responses into SQL formatted storage.
	A. - Solution = We're going to build up the summoner object as much as possible then store it in JSON format.
2. The dynamic nature of each individual summoner profile.
	A. - Solution = Handlebars `if` & `each` statements allow us to control DOM population depending on if the summoner has available data.
3. Promise-Hell; With every individual API request we have to await the response in order to move on to the next API request.
	A. - Solution = Function chain improves readability and problem solving in case of errors.
	B. - Potential = Change to react.js and have individual components for each API request to help UI experience. (currently not enough time but probably will do this after API challenge)






