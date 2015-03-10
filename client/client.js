var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var room = function() {
  return Session.get('room');
};

var viewPlayerName = function() {
  return Session.get('viewplayer');
};

var viewPlayer = function() {
  return Players.findOne({name: viewPlayerName(), game: room()})
}

var game = function() {
  return Games.findOne({href: room()});
};

var loggedInPlayer = function() {
  return Session.get('player');
};

var recordResult = function(winner, loser, $error) {
  if (winner == loser) {
    $error.text('Winner and loser can\'t be the same').show();
    return;
  } else {
    Meteor.call('add_result', winner, loser, room(), function(error, result) {
      var $addResult = $('#add-result');

      if (result) {
        var $undo = $('#undo-record-link');

        $undo.data('result-id', result).show();
        setTimeout(function() {
          $undo.removeData('result-id').slideUp();
        }, 20 * 1000);
      }

      transition($addResult, $('#player-list'), true, $error);
      $addResult.find('#winner, #loser, #opponent').val('');
    });
  }
};

var transition = function($from, $to, slide, $error) {
  if ($error) {
    $error.hide();
  }

  if (slide) {
    var $backArrow = $('.back-arrow');

    $backArrow.hide();
    $from.slideUp();
    $to.slideDown(function() {
      window.scrollTo(0, 0);
      $backArrow.fadeIn();
    });
  } else {
    $from.hide();
    $to.show();
  }
};

var goTo = function(href, $from, $to) {
  if (href == null) {
    href = '';
  }

  if (loggedInPlayer()) {
    href += '?player=' + loggedInPlayer();
  }

  window.history.pushState({}, '', '/' + href);
  setSession();
  transition($from, $to, false);
  Session.set('resultlimit', 10);
  $('#undo-record-link').hide();
  return href;
};

var setSession = function() {
  var href = window.location.pathname;

  if (href == null) {
    href = '';
    setIfNotEqual('room', null);
    setIfNotEqual('viewplayer', null);
  } else {
    var split = href.split('/');

    if (split.length > 2) {
      setIfNotEqual('viewplayer', decodeURI(split[2]));
    } else {
      setIfNotEqual('viewplayer', null);
    }
    setIfNotEqual('room', decodeURI(split[1]));
  }
}

var setIfNotEqual = function(key, value) {
  if (!Session.equals(key, value)) {
    Session.set(key, value);
  }
}

////// Index

Template.main.games = function () {
  return Games.find({}, {sort: {name: 1}});
};

////// Game

Template.main.gameTitle = function() {
  var g = game();
  return g && g.name;
};

Template.main.long = function(title) {
  if (title && title.length > 13) {
    return 'long';
  }
};

Template.main.gamePlayers = function() {
  return Players.find({}, {sort: {inactive: 1, rating: -1, lower_name: 1}});
};

Template.main.isSelf = function(name) {
  return loggedInPlayer() == name ? 'self' : '';
};

Template.main.alphaPlayers = function() {
  return Players.find({}, {sort: {lower_name: 1}});
};

Template.main.loggedin = function() {
  if (loggedInPlayer() && Players.findOne({name: loggedInPlayer()})) {
    return loggedInPlayer();
  }
};

////// Player

Template.main.playerName = function() {
  return viewPlayerName();
};

Template.main.playerRating = function() {
  var p = viewPlayer();
  return p && p.rating;
};

Template.main.playerWins = function() {
  var p = viewPlayer();
  return p && p.wins;
};

Template.main.playerLosses = function() {
  var p = viewPlayer();
  return p && p.losses;
};

Template.main.playerOpponents = function() {
  var results = Results.find({}).fetch(),
      opponentMap = {},
      opponents = [];

  if (!viewPlayerName()) {
    return;
  }
  
  for (var ii = 0, len = results.length; ii < len; ii++) {
    var result = results[ii],
        won = result.winner == viewPlayerName(),
        opponent = won ? result.loser : result.winner;

    if (!opponentMap[opponent]) {
      opponentMap[opponent] = {name: opponent, wins: 0, losses: 0};
    }

    if (won) {
      opponentMap[opponent].wins++;
    } else {
      opponentMap[opponent].losses++;
    }
  }

  for (var key in opponentMap) {
    opponents.push(opponentMap[key]);
  }

  opponents.sort(function(a, b) { return b.wins + b.losses - a.wins - a.losses; });
  return opponents;
}

Template.main.events({

  ////// Index Events

  'click .game-link': function(event) {
    var href = $(event.target).parents('a').attr('href');

    goTo(href, $('#index'), $('#game'));
    return false;
  },

  'click #add-game-link': function () {
    transition($('#game-list-container'), $('#add-game'), true);
    $('#game-name-input').focus();
  },

  'click .add-game-to-index-link': function () {
    var $addGame = $('#add-game');

    transition($addGame, $('#game-list-container'), true, $addGame.find('.error'));
  },

  'click #add-game-submit': function() {
    var $input = $('#game-name-input'),
        $addGame = $('#add-game'),
        $error = $addGame.find('.error');

    var name = $input.val();

    if (name.trim().length == 0) {
      $error.text('Please enter a game name').show();
      return;
    }

    $error.hide();
    Meteor.call('add_game', name, function(error, result) {
      if (error) {
        $error.text(error.reason).show();
        return;
      } else {
        $input.val('');
        goTo(result, $('#index'), $('#game'));
        $addGame.hide();
        $('#game-list-container').show();
      }
    });
  },

  ////// Game Events

  'click .game-to-index-link': function() {
    goTo(null, $('#game'), $('#index'));
  },

  'click #game-results-tab': function() {
    $('.active').removeClass('active');
    $('#game-results-tab').addClass('active');
    $('#game-rankings').hide();
    $('#game-results').show();
    return false;
  },

  'click #game-rankings-tab': function() {
    $('.active').removeClass('active');
    $('#game-rankings-tab').addClass('active');
    $('#game-results').hide();
    $('#game-rankings').show();
    return false;
  },

  'click #add-player-link': function() {
    var $addPlayer = $('#add-player');

    transition($('#player-list'), $addPlayer, true);
    $addPlayer.find('#player-name-input').focus();
  },

  'click #record-link': function() {
    transition($('#player-list'), $('#add-result'), true);
  },

  'click .add-player-to-game-link': function () {
    var $addPlayer = $('#add-player');

    transition($addPlayer, $('#player-list'), true, $addPlayer.find('.error'));
  },

  'click .add-result-to-game-link': function () {
    var $addResult = $('#add-result');

    transition($addResult, $('#player-list'), true, $addResult.find('.error'));
  },

  'click #add-player-submit': function() {
    var $input = $('#player-name-input'),
        $addPlayer = $('#add-player'),
        $error = $addPlayer.find('.error');

    var name = $input.val();

    if (name.trim().length == 0) {
      $error.text('Please enter a player name').show();
      return;
    }

    $error.hide();
    Meteor.call('add_player', name, room(), function(error, result) {
      if (error) {
        $error.text(error.reason).show();
      } else {
        transition($addPlayer, $('#player-list'), true, $error);
        $input.val('');
      }
    });
  },

  'click #add-result-submit': function() {
    var $addResult = $('#add-result'),
        $error = $addResult.find('.error');

    var winner = $addResult.find('#winner').val(),
        loser = $addResult.find('#loser').val();

    if (winner == '' || loser == '') {
      $error.text('Please enter a winner and a loser').show();
    } else {
      recordResult(winner, loser, $error);
    }
  },

  'click #add-win-submit': function() {
    var $addResult = $('#add-result'),
        $error = $addResult.find('.error');

    var winner = loggedInPlayer(),
        loser = $addResult.find('#opponent').val();

    if (loser == '') {
      $error.text('Please enter an opponent').show();
    } else {
      recordResult(winner, loser, $error);
    }
  },

  'click #add-loss-submit': function() {
    var $addResult = $('#add-result'),
        $error = $addResult.find('.error');

    var winner = $addResult.find('#opponent').val(),
        loser = loggedInPlayer();

    if (winner == '') {
      $error.text('Please enter an opponent').show();
    } else {
      recordResult(winner, loser, $error);
    }
  },

  'click #undo-record-link': function(event) {
    var $button = $(event.target);

    var resultId = $button.data('result-id');

    if (resultId) {
      Meteor.call('undo_result', resultId, function(error, result) {
        $button.slideUp();
      });
    }
  },

  'click .player-link': function(event) {
    goTo(room() + '/' + $(event.target).data('name'), $('#game'), $('#player'));
  },

  ////// Player Events

  'click #player-versus-tab': function() {
    $('.active').removeClass('active');
    $('#player-versus-tab').addClass('active');
    $('#player-results').hide();
    $('#player-versus').show();
    return false;
  },

  'click #player-results-tab': function() {
    $('.active').removeClass('active');
    $('#player-results-tab').addClass('active');
    $('#player-versus').hide();
    $('#player-results').show();
    return false;
  },

  'click .player-to-game-link': function() {
    goTo(room(), $('#player'), $('#game'));
  }
});

Template.results.results = function() {
  var playerName = viewPlayerName(),
      query = playerName ? {$or: [{winner: playerName}, {loser: playerName}]} : {},
      results = Results.find(query, {sort: {timestamp: -1}, limit: Session.get('resultlimit')}).fetch(),
      resultsAndDate = [],
      curDate = null;
  
  for (var ii = 0, len = results.length; ii < len; ii++) {
    var result = results[ii],
        date = new Date(result.timestamp),
        dateString = MONTH_NAMES[date.getMonth()] + ' ' + date.getDate();

    if (curDate != dateString) {
      resultsAndDate.push({date: dateString});
      curDate = dateString;
    }

    resultsAndDate.push(result);
  }

  return resultsAndDate;
}

Template.results.moreResults = function() {
  return Results.find({}).count() > Session.get('resultlimit');
}

Template.results.events({
  'click #more-results': function() {
    Session.set('resultlimit', Session.get('resultlimit') + 10);
    return false;
  }
});

Meteor.startup(function() {
  FastClick.attach(document.body);
  Session.set('resultlimit', 10);

  window.onpopstate = function(event) {
    setSession();
  };

  setSession();
  if (!room()) {
    $('#index').show();
  } else if (!viewPlayerName()) {
    $('#game').show();
  } else {
    $('#player').show();
  }

  Deps.autorun(function() {
    setSession();
    if (room()) {
      Meteor.subscribe('players', room());
      Meteor.subscribe('results', room(), viewPlayerName());
    }

    var params = window.location.search.substring(1).split('&');

    for (var ii = 0, len = params.length; ii < len; ii++) {
      var pair = params[ii].split('=');

      if (pair.length == 2 && 
          pair[0] == 'player' &&
          (!room() || Players.findOne({name: pair[1], game: room()}))) {
        Session.set('player', pair[1]);
      }
    }

    Meteor.subscribe('games', room());
  });
});
