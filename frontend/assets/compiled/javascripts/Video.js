(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("VideoController", function($scope, $timeout, iframeService, pageDetailsService, videoService) {

	var viewModel = this;

	$scope.pageDetailsService = pageDetailsService;
	$scope.videoService = videoService;

	viewModel.isExpandMode = false;

	viewModel.seekSelected = function(event) {
		var elementWidth = $(event.currentTarget).width();
		var seekPositionInPercents = 100 * event.offsetX / elementWidth;

		videoService.seekCallback(seekPositionInPercents);
	};

	viewModel.isExpandModeToggled = function() {
		viewModel.isExpandMode = !viewModel.isExpandMode;

		$timeout(function() {
			iframeService.sendSize();
		}, 500);
	}

	$scope.$on("$destroy", function() {
		videoService.reset();
	});

}).service("videoService", function(Progress) {

	var videoService = {
		loadProgress: new Progress(),
		isPlaying: false,
		duration: undefined,
		playedDuration: 0,
		hoveredDuration: null
	};

	videoService.seekCallback = function() {

	};

	videoService.playedDurationChangedCallback = function() {

	};

	videoService.reset = function() {
		videoService.loadProgress = new Progress();
		videoService.isPlaying = false;
		videoService.duration = undefined;
		videoService.playedDuration = 0;
		videoService.seekCallback = function() {

		};
		videoService.playedDurationChangedCallback = function() {

		};
	};

	return videoService;

}).directive("videoPlayer", function($interval, videoService) {

	return {
		restrict: "A",
		link: function(scope, element, attrs) {

			videoService.loadProgress.start("Loading video, wait a sec...");

			var videoElement = element.find("video").get(0);

			if (videoElement.readyState > 3) {
				videoReadyHandler();
			}
			else {
				$(videoElement).bind("canplaythrough", function() {
					if (videoService.duration === undefined) {
						videoReadyHandler();
					}
				});
			}

			function videoReadyHandler() {
				videoService.duration = videoElement.duration;

				var oldSeekCallback = videoService.seekCallback;
				videoService.seekCallback = function(seekPositionInPercents) {
					videoService.playedDuration = videoElement.currentTime = videoService.duration * seekPositionInPercents / 100;
					videoService.playedDurationChangedCallback();

					oldSeekCallback();
				};

				var updateCurrentTimePeriodicallyPromise;

				scope.$watch(function() {
					return videoService.isPlaying;
				}, function(shouldPlay, wasPlaying) {

					if (shouldPlay) {
						videoElement.play();

						updateCurrentTimePeriodicallyPromise = $interval(function() {
							videoService.playedDuration = videoElement.currentTime;
							videoService.playedDurationChangedCallback();

							if (videoElement.paused) {
								videoService.isPlaying = false;
							}
						}, 1000 / 60);
					}
					else if (wasPlaying) {
						if (!videoElement.paused) {
							videoElement.pause();
						}

						$interval.cancel(updateCurrentTimePeriodicallyPromise);
					}
				});

				videoService.loadProgress.success();

				scope.$apply();
			}
		}
	};

}).directive("videoSeekHover", function(videoService) {

	return {
		restrict: "A",
		link: function(scope, element) {
			element.bind("mousemove", function(event) {
				videoService.hoveredDuration = videoService.duration * event.offsetX / element.width();

				scope.$apply();
			});

			element.bind("mouseleave", function() {
				videoService.hoveredDuration = null;

				scope.$apply();
			});
		}
	}
});

})();
