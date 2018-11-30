'use strict';

var shuffleArray = function (array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

bootleggerApp.filter('isMine', function () {
  return function (items, params) {
    var filtered = [];
    // If time is with the range
    angular.forEach(items, function (item) {

      if ((typeof (params.created_by) != 'undefined' && item.created_by == params.created_by) || typeof (params.created_by) == 'undefined')
        filtered.push(item);
    });
    return filtered;
  };
});

bootleggerApp.controller('list', ['$scope', '$http', '$sce', '$localStorage', '$timeout', '$interval', '$bootleggerSails', function ($scope, $http, $sce, $storage, $timeout, $interval, socket) {

  $scope.sources = [];
  $scope.playlist = [];
  $scope.loading = true;

  $scope.edit = { title: '', description: '' };

  $scope.restartedit = function (id, event) {
    socket.post('/watch/restartedit/' + id).then(function (resp) {
      //done
    });

    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  $scope.formatDate = function (date) {
    var dateOut = moment(date, 'DD-MM-YYYY');
    return dateOut.toDate();
  };

  (function () {
    //usSpinnerService.spin('spinner-1');

    try {
      // addthis.init();
    }
    catch (e) {
      console.log("AddThis not defined in localmode");
    }

    socket.on('edits', function (resp) {
      //update the progress...
      for (var i = 0; i < $scope.edits.length; i++) {
        if ($scope.edits[i].id == resp.data.edit.id) {
          $scope.edits[i] = resp.data.edit;
        }
      }
    });

    // Using .success() and .error()
    socket.get('/watch/mymedia/')
      .then(function (resp) {
        $scope.edits = resp.data.edits;

        socket.post('/watch/editupdates', { edits: _.pluck($scope.edits, 'id') }).then(function (resp) {

        });

        $timeout(function () {
          // addthis.toolbox('.addthis_toolbox');
        }, 0);

        $scope.shoots = resp.data.shoots;
        $scope.owned = resp.data.owned;
        $scope.loading = false;
      });

  })();

}]);

bootleggerApp.controller('edits', ['$scope', '$http', '$sce', '$localStorage', '$timeout', '$interval', '$bootleggerSails', function ($scope, $http, $sce, $storage, $timeout, $interval, socket) {

  $scope.sources = [];
  $scope.playlist = [];
  $scope.loading = true;

  $scope.edit = { title: '', description: '' };

  $scope.restartedit = function (id, event) {
    socket.post('/watch/restartedit/' + id).then(function (resp) {
      //done
    });

    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  $scope.getMediaThumb = function (media) {
    if (media[0].thumb)
      return media[0].id;
    else
      return media[1].id;
  }

  $scope.formatDate = function (date) {
    var dateOut = moment(date, 'DD-MM-YYYY');
    return dateOut.toDate();
  };

  // $scope.latestUser = function(user)
  // {
    //from all users - which ones match:

    // var users = _.filter($scope.edits, function (e) {
    //   return e.user.name == user;
    // });

    // console.log(users);
    
    // var sorted = _.sortBy(users,'updatedAt');

    // console.log(sorted);

    // return _.first(sorted).user_id;
  // };

  (function () {
    //usSpinnerService.spin('spinner-1');


    //  addthis.init();

    //  socket.on('135,function(resp){
    //      //update the progress...
    //      console.log("edit update");
    //      for (var i=0;i<$scope.edits.length;i++)
    //      {
    //           if ($scope.edits[i].id == resp.data.edit.id)
    //           {
    //               $scope.edits[i] = resp.data.edit;
    //           }   
    //      }
    //  });

    
    

    $scope.getClipLength = function (point) {
      // if (media.inpoint) {
        var lena = point.split(':');
        var time = (parseInt(lena[0]) * 3600) + (parseInt(lena[1]) * 60) + (parseFloat(lena[2]));
        return time * 1000;
      // }
      // else {
        // return 100;
      // }
    };

    $scope.medialength = function (media) {
      //aggregate media length:
      //TODO:
      var total = 0;
      _.each(media,function(m){
        // console.log(m);
        
        total += $scope.getClipLength(m.outpoint) - $scope.getClipLength(m.inpoint);
      })

      return msToTimeS(total);
    }

    // Using .success() and .error()
    socket.get('/watch/alledits/' + mastereventid)
      .then(function (resp) {
        $scope.edits = resp.data;

        $scope.groups = _.uniq(_.map($scope.edits, function (e) {
          return e.user.name;
        }));

        socket.post('/watch/editupdates', { edits: _.pluck($scope.edits, 'id') }).then(function (resp) {

        });

        $timeout(function () {
          // addthis.toolbox('.addthis_toolbox');
          $('.dropdown-submenu a.reassign').on("click", function(e){
            $(this).next('ul').toggle();
            e.stopPropagation();
            e.preventDefault();
          });
        }, 0);

        $scope.loading = false;
      });

  })();

}]);

function msToTime(s) {

  function addZ(n) {
    return (n < 10 ? '0' : '') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
}

function msToTimeS(s) {

  function addZ(n) {
    return (n < 10 ? '0' : '') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return addZ(mins) + ':' + addZ(secs);
}