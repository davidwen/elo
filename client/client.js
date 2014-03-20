var CUR_DATE;
var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var resultsDeps = new Deps.Dependency();

var room = function() {
  return Session.get('room');
};

var game = function() {
  return Games.findOne({href: room()});
};

var loggedInPlayer = function() {
  return Session.get('player');
}

var recordResult = function(winner, loser, $error) {
  if (winner == loser) {
    $error.text('Winner and loser can\'t be the same').show();
  } else {
    Meteor.call('add_result', winner, loser, room(), function(error, result) {
      if (result) {
        $('#undo-record-link').attr('result-id', result).show();
        setTimeout(function() {
          $('#undo-record-link').removeAttr('result-id').slideUp();
        }, 20 * 1000);
      }
      $error.hide();
      $('#add-result').slideUp();
      $('#player-list').slideDown();
      $('#winner, #loser, #opponent').val('');
    });
  }
};

var retainPlayerParam = function(href) {
  if (loggedInPlayer()) {
    href += '?player=' + loggedInPlayer();
  }
  return href;
}

Template.index.show = function() {
  return !room();
};

Template.index.games = function () {
  return Games.find({}, {sort: {name: 1}});
};

Template.index.events({
  'click .game-link': function() {
    var href = $(event.target).parents('a').attr('href');
    window.history.pushState(
      {},
      '',
      retainPlayerParam(href));
    Session.set('room', href);
    return false;
  },

  'click #add-link': function () {
    $('#game-list-container').slideUp();
    $('#add-game').slideDown(function() {
      $('#name-input').focus();
    });
    return false;
  },

  'click .back-link': function () {
    $('.error').hide();
    $('#add-game').slideUp();
    $('#game-list-container').slideDown();
    return false;
  },

  'click #add-game-submit': function() {
    var name = $('#name-input').val();
    var $error = $('.error');
    if (name.trim().length == 0) {
      $error.text('Enter a game name').show();
      return;
    }
    $error.hide();
    Meteor.call('add_game', name, function(error, result) {
      if (error) {
        $error.text(error.reason).show();
      } else {
        window.history.pushState(
          {},
          '',
          retainPlayerParam(result));
        Session.set('room', result);
      }
    });
  }
});

Template.game.show = function() {
  return room();
};

Template.game.title = function() {
  var g = game();
  return g && g.name;
};

Template.game.players = function() {
  return Players.find({}, {sort: {inactive: 1, rating: -1, name: 1}});
}

Template.game.alphaPlayers = function() {
  return Players.find({}, {sort: {name: 1}});
}

Template.game.loggedin = function() {
  return loggedInPlayer();
}

Template.game.events({
  'click #home-link': function() {
    window.history.pushState(
      {},
      '',
      retainPlayerParam('/'));
    Session.set('room', null);
  },

  'click #results-tab': function() {
    $('.active').removeClass('active');
    $('#results-tab').addClass('active');
    $('#rankings').slideUp();
    $('#results').slideDown();
    return false;
  },

  'click #rankings-tab': function() {
    $('.active').removeClass('active');
    $('#rankings-tab').addClass('active');
    $('#results').slideUp();
    $('#rankings').slideDown();
    return false;
  },

  'click #add-link': function() {
    $('#player-list').slideUp();
    $('#add-player').slideDown(function() {
      $('#name-input').focus();
    });
  },

  'click #record-link': function() {
    $('#player-list').slideUp();
    $('#add-result').slideDown();
  },

  'click .back-link': function () {
    $('.error').hide();
    $('#add-player, #add-result').slideUp();
    $('#player-list').slideDown();
    return false;
  },

  'click #add-player-submit': function() {
    var name = $('#name-input').val();
    var $error = $('#add-player .error');
    if (!name) {
      $error.text('Please enter a player name').show();
    }
    $error.hide();
    Meteor.call('add_player', name, room(), function(error, result) {
      if (error) {
        $error.text(error.reason).show();
      } else {
        $error.hide();
        $('#add-player').slideUp();
        $('#player-list').slideDown();
        $('#name-input').val('');
      }
    });
  },

  'click #add-result-submit': function() {
    var winner = $('#winner').val();
    var loser = $('#loser').val();
    var $error = $('#add-result .error');
    if (winner == '' || loser == '') {
      $error.text('Please enter a winner and a loser').show();
    }
    recordResult(winner, loser, $error);
  },

  'click #add-win-submit': function() {
    var winner = loggedInPlayer();
    var loser = $('#opponent').val();
    var $error = $('#add-result .error');
    if (loser == '') {
      $error.text('Please enter an opponent').show();
    } else {
      recordResult(winner, loser, $error);
    }
  },

  'click #add-loss-submit': function() {
    var winner = $('#opponent').val();
    var loser = loggedInPlayer();
    var $error = $('#add-result .error');
    if (winner == '') {
      $error.text('Please enter an opponent').show();
    } else {
      recordResult(winner, loser, $error);
    }
  },

  'click #undo-record-link': function() {
    var $button = $(event.target);
    var resultId = $button.attr('result-id');
    if (resultId) {
      Meteor.call('undo_result', resultId, function(error, result) {
        $button.slideUp();
      });
    }
  }
});

Template.results.rendered = function() {
  CUR_DATE = null;
}

Template.results.results = function() {
  resultsDeps.depend();
  return Results.find({}, {sort: {timestamp: -1}, limit: 10});
}

Template.results.maybeSimpleDate = function() {
  var date = new Date(this.timestamp);
  var dateString = MONTH_NAMES[date.getMonth()] + ' ' + date.getDate();
  if (CUR_DATE == null || CUR_DATE != dateString) {
    CUR_DATE = dateString
    var $separator = $('<li/>')
      .text(dateString)
      .addClass('date-separator');
    return $separator[0].outerHTML;
  }
}

Meteor.startup(function() {
  FastClick.attach(document.body);
  Deps.autorun(function() {
    var pathSplit = window.location.pathname.split('/');
    if (pathSplit.length >= 2 && pathSplit[1] != '') {
      Session.set('room', decodeURI(pathSplit[1]));
      Meteor.subscribe('players', room());
      Meteor.subscribe('results', room());
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
    Results.find({}).observe({
      added: function() {
        resultsDeps.changed();
      },
      removed: function() {
        resultsDeps.changed();
      }
    });
  });
});
