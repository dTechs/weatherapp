angular.module('NZWApp',['ngRoute'])

.config(function($routeProvider){
	$routeProvider
		.when('/',{
			templateUrl: 'templates/home.html',
			controller: 'MainCtrl'
		})
		.when('/settings',{
			templateUrl: 'templates/settings.html',
			controller: 'SettingsCtrl'
		})
		.otherwise({redirectTo: '/'});
})

//Wunderground Service implementation
.provider('Weather', function(){
	var apikey = "";

	this.getUrl = function (type, ext) {
		// body...
		return "http://api.wunderground.com/api/" +
			this.apikey + "/" + type + "/q/" + ext + '.json';
	};

	this.setApiKey = function(key){
		if (key) this.apikey = key;
	};

	this.$get = function ($q, $http) {
		// body...

		var self = this;

		return {
			//Service Object
			getWeatherForecast: function(city){
				var d = $q.defer();

				$http({
					method: 'GET',
					url: self.getUrl("forecast", city),
					cache: true
				}).success(function(data){
					
					// The wunderground API returns the 
	        		// object that nests the forecasts inside
	        		// the forecast.simpleforecast key
	        		d.resolve(data.forecast.simpleforecast);
				}).error(function(err){
					d.reject(err);
				});
				return d.promise;
			},

			getCityDetails: function(query){
				var d = $q.defer();
				$http({
					method: 'GET',
					url: "http://autocomplete.wunderground.com/aq?query=" + query
				}).success(function(data){
					d.resolve(data.RESULTS);
				}).error(function(err){
					d.reject(err);
				})
				return d.promise;
			}
		}
	}
})

//API_KEY: e6549dd2ef337ff1

.config(function(WeatherProvider){
	WeatherProvider.setApiKey('e6549dd2ef337ff1');
})


//User Service
.factory('UserService', function (){
	var defaults = {
		location: 'autoip'
	};
	var service = {
		user: {},
		save: function(){
			sessionStorage.presently = angular.toJson(service.user);
		},
		restore: function(){
			//Pull from sessionStorage
			service.user = angular.fromJson(sessionStorage.presently) || defaults
			
			return service.user;
		}
	};

	// Immediately call restore from the session storage
  	// so we have our user data available immediately
	service.restore();

	return service;
})

.controller('MainCtrl', function($scope, $timeout, Weather, UserService){

	//Build the date object
	$scope.date = {};

	//clock update function
	var updateTime = function(){
		$scope.date.raw = new Date();
		$timeout(updateTime, 1000);
	}

	//invoke update function
	updateTime();

	$scope.weather = {};
	$scope.user = UserService.user;
	//Hardcoding New Zealand for Now
	Weather.getWeatherForecast($scope.user.location).then(function(data){
		$scope.weather.forecast = data;
	})
})

.controller('SettingsCtrl', function($scope, UserService, Weather){
	//console.log(UserService);
	$scope.user = UserService.user;

	$scope.save = function(){
		UserService.save();
	}

	$scope.fetchCities = Weather.getCityDetails;
	
})


//Directive to supply autocomplete cities

.directive('autoFill', function($timeout) {
	return {
		restrict: 'EA',
		scope: {
			autoFill: '&',
			ngModel: '='
		},
		compile: function(tEle, tAttrs){
			//Our comiple function
			var tplEl = angular.element('<div class="typeahead">' +
			  '<input type="text" autocomplete="off" />' +
			  '<ul id="autolist" ng-show="reslist">' +
			    '<li ng-repeat="res in reslist" ' +
			      '>{{res.name}}</li>' +
			  '</ul>' +
			  '</div>');
			
			var input = tplEl.find('input');
			input.attr('type', tAttrs.type);
			input.attr('ng-model', tAttrs.ngModel);
			input.attr('timezone', tAttrs.timezone);
			tEle.replaceWith(tplEl);

			return function (scope, ele, attrs, strl){
				var minKeyCount = attrs.minKeyCount || 3, 
					timer,
					input = ele.find('input');

				input.bind('keyup', function(e) {
					val = ele.val();
					if (val.length < minKeyCount) {
						if (timer) $timeout.cancel(timer);
							scope.reslist = null;
							return;
						} else {
							if (timer) $timeout.cancel(timer);
								timer = $timeout(function() {
									scope.autoFill()(val)
									.then(function(data) {
					  					if (data && data.length > 0) {
					 					   scope.reslist = data;
					 					   scope.ngModel = data[0].zmw;
					 					   scope.timezone = data[0].tz;
										}
									});
							}, 300);
						}
					});

				// Hide the reslist on blur
				input.bind('blur', function(e) {
					scope.reslist = null;
					scope.$digest();
				});

			}
		}
	}

});

