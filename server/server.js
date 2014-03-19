Meteor.methods({
  add_game: function (name) {
    var href = name.toLowerCase().replace(/\W+/g, '');
    if (href.length > 0 && !Games.findOne({href: href})) {
      Games.insert({name: name, href: href});
      return href;
    }
    if (href.length == 0) {
      throw new Meteor.Error(400, 'Enter a game name');
    } else {
      throw new Meteor.Error(400, 'Game "' + name + '" already exists');
    }
  },

  add_player: function (name, game) {
    var g = Games.findOne({href: game});
    var p = Players.findOne({name: name, game: game});
    if (g && !p) {
      Players.insert({name: name, game: game, rating: 1000});
      return;
    }
    throw new Meteor.Error(400, 'Player "' + name + '" already exists');
  },

  add_result: function(winner, loser, game) {
    var w = Players.findOne({name: winner, game: game});
    var l = Players.findOne({name: loser, game: game});
    if (w && l) {
      var diffs = calculateEloDiffs(w.rating, l.rating);
      var winnerDiff = diffs[0];
      var loserDiff = diffs[1];
      Players.update({name: winner},
                     {$set: {rating: w.rating + winnerDiff}});
      Players.update({name: loser},
                     {$set: {rating: l.rating + loserDiff}});
      Results.insert({
        winner: winner,
        loser: loser,
        game: game,
        winner_change: winnerDiff,
        loser_change: loserDiff,
        timestamp: new Date().getTime()
      });
    }
  }
});