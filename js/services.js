angular.module('NZWApp', [])

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

		return{
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
			}
		}
	}
})

//API_KEY: e6549dd2ef337ff1

.config(function(WeatherProvider){
	WeatherProvider.setApiKey('e6549dd2ef337ff1')
})