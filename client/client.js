var CUR_DATE;
var RESULT_LIMIT;
var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var resultsDeps = new Deps.Dependency();

var room = function() {
  return Session.get('room');
};

var viewPlayer = function() {
  return Session.get('viewplayer')
}

var game = function() {
  return Games.findOne({href: room()});
};

var loggedInPlayer = function() {
  return Session.get('player');
}

var recordResult = function(winner, loser, $error) {
  if (winner == loser) {
    $error.text('Winner and loser can\'t be the same').show();
    return;
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

var goTo = function(href) {
  if (href == null) {
    href = '';
  }
  if (loggedInPlayer()) {
    href += '?player=' + loggedInPlayer();
  }
  window.history.pushState({}, '', '/' + href);
  setSession();
  return href;
}

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

Template.index.show = function() {
  return !room();
};

Template.index.games = function () {
  return Games.find({}, {sort: {name: 1}});
};

Template.index.events({
  'click .game-link': function() {
    var href = $(event.target).parents('a').attr('href');
    goTo(href);
    return false;
  },

  'click #add-link': function () {
    $('#game-list-container').slideUp();
    $('#add-game').slideDown(function() {
      $('#name-input').focus();
    });
  },

  'click .back-link': function () {
    $('.error').hide();
    $('#add-game').slideUp();
    $('#game-list-container').slideDown();
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
        return;
      } else {
        goTo(result);
      }
    });
  }
});

Template.game.show = function() {
  return room() && !viewPlayer();
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
    goTo(null);
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
    if (name.trim().length == 0) {
      $error.text('Please enter a player name').show();
      return;
    }
    $error.hide();
    Meteor.call('add_player', name, room(), function(error, result) {
      if (error) {
        $error.text(error.reason).show();
        return;
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
      return;
    }
    recordResult(winner, loser, $error);
  },

  'click #add-win-submit': function() {
    var winner = loggedInPlayer();
    var loser = $('#opponent').val();
    var $error = $('#add-result .error');
    if (loser == '') {
      $error.text('Please enter an opponent').show();
      return;
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
      return;
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
  },

  'click .player-link': function() {
    goTo(room() + '/' + $(event.target).attr('data-name'));
  }
});

Template.results.rendered = function() {
  CUR_DATE = null;
}

Template.results.results = function() {
  resultsDeps.depend();
  return Results.find({}, {sort: {timestamp: -1}, limit: Session.get('resultlimit')});
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

Template.results.moreResults = function() {
  return Results.find({}).count() > Session.get('resultlimit');
}

Template.results.events({
  'click #more-results': function() {
    Session.set('resultlimit', Session.get('resultlimit') + 10);
    return false;
  }
})

Template.player.show = function() {
  return viewPlayer() != null;
}

Template.player.player = function() {
  return Players.findOne({name: viewPlayer(), game: room()});
}

Template.player.events({
  'click .back-link': function() {
    goTo(room());
  }
})

Meteor.startup(function() {
  FastClick.attach(document.body);
  Session.set('resultlimit', 10);
  window.onpopstate = function(event) {
    setSession();
  };
  Deps.autorun(function() {
    setSession();
    if (room()) {
      Meteor.subscribe('players', room());
      Meteor.subscribe('results', room(), viewPlayer());
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
