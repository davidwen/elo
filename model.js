Players = new Meteor.Collection('players');
// {name: 'David', game: 'foosball', wins: 4, losses: 3, last_game: 12345...}

Games = new Meteor.Collection('games');
// {name: 'Foosball', href: 'foosball'}

Results = new Meteor.Collection('results');
// {winner: 'David', loser: 'Bob', game: foosball, timestamp: 12345, winner_change: 10, loser_change: 9}

if (Meteor.isServer) {
  Meteor.publish('games', function(game) {
    if (game && game.length > 0) {
        return Games.find({href: game});
    } else {
        return Games.find({});
    }
  });

  Meteor.publish('players', function(game) {
    return Players.find({game: game});
  });

  Meteor.publish('results', function(game) {
    return Results.find({game: game});
  });
}