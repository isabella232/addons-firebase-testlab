(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("PageDashboardController", function($routeParams, $timeout, iframeService, routeService, requestService, pageDetailsService, Progress, Test, TestIssue) {

	var viewModel = this;

	var reloadIntervalInMilliseconds = 5000;

	var buildSlug = $routeParams.buildSlug;

	viewModel.summarizedTestStates = _.filter(Test.states, function(aTestState) {
		return aTestState.id != "in_progress";
	});

	viewModel.tests;
	viewModel.loadTestsProgress = new Progress();

	function loadTests() {
		viewModel.loadTestsProgress.start("Loading tests, wait a sec...");

		requestService.getTests(buildSlug).then(function(data) {
			if (data === null) {
				iframeService.sendNoGeneratedTestsFound();

				viewModel.loadTestsProgress.error(new Error("No generated tests found."));

				return;
			}
			viewModel.tests = _.map(data, function(aTestData) {
				var aTest = new Test();
				aTest.id = aTestData.id;
				aTest.state = Test.stateFromTestData(aTestData);
				aTest.deviceName = aTestData.deviceName;
				aTest.apiLevel = aTestData.apiLevel;
				aTest.durationInSeconds = aTestData.durationInSeconds;
				aTest.testCaseCount = aTestData.testCaseCount;
				aTest.failedTestCaseCount = aTestData.failedTestCaseCount;
				aTest.orientation = Test.orientation(aTestData.orientation);
				aTest.locale = aTestData.locale;
				aTest.testSuiteXMLurl = aTestData.testSuiteXMLurl;
				aTest.videoURL = aTestData.videoURL;
				aTest.screenshotURLs = aTestData.screenshotURLs;
				aTest.activityMapURL = aTestData.activityMapURL;
				aTest.logsURL = aTestData.logsURL;
				aTest.fileURLs = aTestData.fileURLs;

				aTest.issues = aTestData.issues ? _.map(aTestData.issues, function(aTestIssueData) {
					var testIssue = new TestIssue();
					testIssue.name = aTestIssueData.name;
					testIssue.stacktrace = aTestIssueData.stacktrace;

					return testIssue;
				}) : [];

				return aTest;
			});

			viewModel.loadTestsProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);

			if (_.find(viewModel.tests, {
				state: _.find(Test.states, {
					id: "in_progress"
				})
			})) {
				$timeout(loadTests, reloadIntervalInMilliseconds);
			}
		}, function(error) {
			viewModel.loadTestsProgress.error(new Error("Error loading tests."));

			$timeout(loadTests, reloadIntervalInMilliseconds);
		});
	}

	viewModel.numberOfTestsWithState = function(state) {
		return viewModel.tests ? _.filter(viewModel.tests, {
			state: state
		}).length : undefined;
	};

	viewModel.widthPercentForTestCase = function(test, stateID) {
		if (test.testCaseCount == 0) {
			switch (stateID) {
				case "passed":
					return 0;
				case "failed": {
					return 100;
				}
			}
		}

		var failRate = test.failedTestCaseCount / test.testCaseCount;

		var normalizedFailRate = failRate;
		if (failRate < 0.2 && failRate != 0) {
			normalizedFailRate = 0.2;
		}
		else if (failRate > 0.8 && failRate != 1) {
			normalizedFailRate = 0.8;
		}

		var rate;
		switch (stateID) {
			case "passed": {
				rate = 1 - normalizedFailRate;

				break;
			}
			case "failed": {
				rate = normalizedFailRate;

				break;
			}
		}

		return Math.floor(100 * rate);
	};

	viewModel.testPath = function(test) {
		return routeService.testPath(buildSlug, test.id);
	};

	viewModel.testSelected = function(test) {
		pageDetailsService.test = test;
	};

	loadTests();

});

})();
