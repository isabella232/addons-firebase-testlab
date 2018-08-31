(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("MetricsController", function($scope, $routeParams, $filter, $timeout, iframeService, requestService, metricsService, videoService, Progress) {

	var viewModel = this;

	$scope.metricsService = metricsService;
	$scope.videoService = videoService;

	viewModel.loadMetricsProgress = new Progress();
	viewModel.metrics = [{
		id: "cpu",
		cssClass: "cpu",
		name: "CPU performance",
		sampleGroups: undefined,
		valueGrid: undefined,
		sampleCurves: undefined,
		isOpen: false
	}, {
		id: "memory",
		cssClass: "memory",
		name: "Memory usage (KB)",
		sampleGroups: undefined,
		valueGrid: undefined,
		sampleCurves: undefined,
		isOpen: false
	}, {
		id: "network",
		cssClass: "network",
		name: "Network (KB/S)",
		sampleGroups: undefined,
		valueGrid: undefined,
		sampleCurves: undefined,
		isOpen: false
	}];

	function loadMetrics() {
		viewModel.loadMetricsProgress.start("Loading metrics, wait a sec...");

		requestService.getMetrics($routeParams.buildSlug, $routeParams.testID).then(function(data) {
			_.each(data, function(sampleGroupsOfType, typeID) {
				_.find(viewModel.metrics, {
					id: typeID
				}).sampleGroups = sampleGroupsOfType;
			});

			_.each(viewModel.metrics, function(aMetric) {
				var highestValueInAllSampleGroups = 0;

				_.each(aMetric.sampleGroups, function(aSampleGroup) {
					highestValueInAllSampleGroups = Math.max(highestValueInAllSampleGroups, viewModel.highestValue(aSampleGroup.samples));
				});

				if (highestValueInAllSampleGroups == 0) {
					highestValueInAllSampleGroups = 100;
				}

				aMetric.valueGrid = _.map(_.range(5), function(index, _index, list) {
					return (highestValueInAllSampleGroups * index / (list.length > 1 ? list.length - 1 : 1));
				}).reverse();

				aMetric.sampleCurves = _.map(aMetric.sampleGroups, function(aSampleGroup) {
					return pathCurveFromSamples(aSampleGroup.samples);
				});
			});

			viewModel.loadMetricsProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);
		}, function(error) {
			viewModel.loadMetricsProgress.error(new Error("Error loading metrics."));
		});
	}

	function pathCurveFromSamples(samples) {
		var pathCurve = "M-100 200";

		_.each(samples, function(aSample, index, list) {
			var positionX = 100 * aSample.time / videoService.duration;
			var positionY = 100 - 100 * viewModel.valueAtTime(samples, aSample.time) / (viewModel.highestValue(samples) > 0 ? viewModel.highestValue(samples) : 1);

			if (index == 0) {
				pathCurve += " L-100 " + positionY;
			}

			pathCurve += " L" + positionX + " " + positionY;

			if (index == list.length - 1) {
				pathCurve += " L" + positionX + " 100 L200 100 L200 200 Z";
			}
		});

		return pathCurve;
	}

	viewModel.sampleCurveLinearGradientID = function(metric) {
		return "metric-linear-gradient-" + metric.id;
	};

	viewModel.sampleCurveFillURL = function(metric) {
		return window.location + "#" + viewModel.sampleCurveLinearGradientID(metric);
	};

	viewModel.metricToggled = function(metric) {
		metric.isOpen = !metric.isOpen;

		$timeout(function() {
			iframeService.sendSize();
		}, 500);
	};

	viewModel.seekSelected = function(event) {
		var fullScaleWidth = $(event.currentTarget).width();

		var positionX = event.offsetX;
		if (event.target != event.currentTarget) {
			positionX += $(event.target).offset().left - $(event.currentTarget).offset().left;
		}

		var seekPositionInPercents = 100 * positionX / fullScaleWidth;

		videoService.seekCallback(seekPositionInPercents);
	};

	viewModel.valueAtTime = function(samples, time) {
		var choppedSamples = samples.concat([{
			time: _.last(samples).time + 0.001,
			value: 0
		}]);

		var sampleAtTime = _.find(choppedSamples, {
			time: time
		});

		if (sampleAtTime) {
			return sampleAtTime.value;
		}

		var leftSampleIndex = _.findLastIndex(choppedSamples, function(aSample) {
			return aSample.time < time;
		});
		var leftSample = choppedSamples[leftSampleIndex];

		if (leftSample == _.last(choppedSamples)) {
			return leftSample.value;
		}

		var rightSample = choppedSamples[leftSampleIndex + 1];

		return (leftSample.value * (rightSample.time - videoService.playedDuration) + rightSample.value * (videoService.playedDuration - leftSample.time)) / (rightSample.time - leftSample.time);
	};

	viewModel.displayValueAtCurrentTime = function(metric) {
		var displayValue = "";

		_.each(metric.sampleGroups, function(aSampleGroup, index) {
			if (index > 0) {
				displayValue += " ";
			}

			var sampleGroupPlaceholder;

			switch (aSampleGroup.id) {
				case "upload":
					sampleGroupPlaceholder = "u: ";

					break;
				case "download":
					sampleGroupPlaceholder = "d: ";

					break;
				default:
					sampleGroupPlaceholder = "";

					break;
			}

			displayValue += sampleGroupPlaceholder;
			displayValue += $filter("metricValue")(viewModel.valueAtTime(aSampleGroup.samples, videoService.playedDuration), metric.id);
		});

		return displayValue;
	};

	viewModel.highestValue = function(samples) {
		return _.max(samples, "value").value;
	};

	loadMetrics();

	$scope.$on("$destroy", function() {
		metricsService.reset();
	});

}).service("metricsService", function() {

	var metricsService = {
		timeGrid: undefined,
	};

	metricsService.reset = function() {
		metricsService.timeGrid = undefined;
	};

	return metricsService;

}).directive("metricsHorizontalScale", function(metricsService, videoService) {

	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			function setTimes(shouldRunDigestLoop) {
				if (shouldRunDigestLoop === undefined) {
					shouldRunDigestLoop = true;
				}

				if (!videoService.duration) {
					var wasTimesDefined = metricsService.timeGrid !== undefined;
					metricsService.timeGrid = undefined;

					if (wasTimesDefined && metricsService.timeGrid === undefined && shouldRunDigestLoop) {
						scope.$apply();
					}

					return;
				}

				var numberOfTimestamps;
				if (element.outerWidth() > 600) {
					numberOfTimestamps = 6;
				}
				else if (element.outerWidth() > 500) {
					numberOfTimestamps = 5;
				}
				else if (element.outerWidth() > 400) {
					numberOfTimestamps = 4;
				}
				else if (element.outerWidth() > 300) {
					numberOfTimestamps = 3;
				}
				else {
					numberOfTimestamps = 2;
				}

				var oldTimeGridSize = metricsService.timeGrid ? metricsService.timeGrid.length : undefined;

				metricsService.timeGrid = _.map(_.range(numberOfTimestamps), function(index, _index, list) {
					return (videoService.duration * index / (list.length > 1 ? list.length - 1 : 1));
				});

				if (metricsService.timeGrid.length != oldTimeGridSize && shouldRunDigestLoop) {
					scope.$apply();
				}
			}

			$(window).bind("resize", setTimes);

			scope.$watch(function() {
				return videoService.duration;
			}, function(duration) {
				setTimes(false);
			});

			scope.$on("$destroy", function() {
				$(window).unbind("resize", setTimes);
			});
		}
	};

}).filter("metricValue", function() {

	return function(value, metricTypeID) {
		switch (metricTypeID) {
			case "cpu":
				return Math.round(value) + "%";
			case "memory":
			case "network":
				if (value >= 1000) {
					return Math.round(value / 100) / 10 + "k";
				}

				return Math.round(value);
		}
	};

});

})();
