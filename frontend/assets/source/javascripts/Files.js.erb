(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("FilesController", function($scope, $timeout, iframeService, pageDetailsService) {

	var viewModel = this;

	$scope.pageDetailsService = pageDetailsService;

	viewModel.files;

	var unwatchTest = $scope.$watch(function() {
		return pageDetailsService.test;
	}, function(test) {
		if (!test) {
			return;
		}

		viewModel.files = _.map(pageDetailsService.test.fileURLs, function(aFileURL, aFileName) {
			return {
				name: aFileName,
				url: aFileURL
			};
		});

		$timeout(function() {
			iframeService.sendSize();
		}, 50);

		unwatchTest();
	});

});

})();
