### Elo.js

http://elo.meteor.com

#### Overview

Easily create ladders using the Elo rating system, built with the Meteor.js framework.

#### Requirements

Install [Meteor](http://docs.meteor.com/#quickstart)

    $ curl https://install.meteor.com | /bin/sh

Install [Meteorite](https://github.com/oortcloud/meteorite), a package manager for the Meteor framework

    $ npm install -g meteorite

#### Usage

Once all the requirements are installed, run Elo.js locally by navigating to the elo project directory and running

    $ mrt run

To deploy an Elo.js instance

    $ mrt deploy <your ladder name>.meteor.com

#### Features

* Mobile friendly
* Can "login" as player by adding ```?player=<player name>``` to end of URL (e.g. http://elo.meteor.com?player=David). This changes the result submission screen to just choose your opponent instead of a winner and loser.
