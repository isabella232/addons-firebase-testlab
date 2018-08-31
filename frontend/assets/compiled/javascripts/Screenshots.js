(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("ScreenshotsController", function($scope, $q, $timeout, requestService, pageDetailsService, iframeService, Progress) {

	var viewModel = this;

	$scope.pageDetailsService = pageDetailsService;

	viewModel.screenshots;
	viewModel.loadScreenshotsProgress = new Progress();

	var unwatchTest = $scope.$watch(function() {
		return pageDetailsService.test;
	}, function(test) {
		if (!test) {
			return;
		}

		loadScreenshots();
		unwatchTest();
	});

	function loadScreenshots() {
		viewModel.loadScreenshotsProgress.start("Loading screenshots, wait a sec...");

		viewModel.screenshots = _.map(pageDetailsService.test.screenshotURLs, function(aScreenshotURL) {
			var filenameRegexp = new RegExp(/^.+\/(.+)\?.*$/);

			return {
				src: aScreenshotURL,
				filename: filenameRegexp.test(aScreenshotURL) ? filenameRegexp.exec(aScreenshotURL)[1] : null
			};
		});

		$q.all(_.map(viewModel.screenshots, function(aScreenshot) {
			var img = $("<img />").attr("src", aScreenshot.src).on("load", function() {
				if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
					return $q.reject(new Error("Broken image."));
				} else {
					return $q.when();
				}
			});
		})).then(function() {
			viewModel.loadScreenshotsProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);
		}, function(error) {
			viewModel.loadScreenshotsProgress.error(error);
		});
	}

});

})();
