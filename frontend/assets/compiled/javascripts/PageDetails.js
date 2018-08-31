(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("PageDetailsController", function($scope, $routeParams, $q, $timeout, $anchorScroll, iframeService, routeService, requestService, pageDetailsService, videoService, Progress, Test, TestCase, TestIssue) {

	var viewModel = this;

	viewModel.backPath = routeService.dashboardPath($routeParams.buildSlug);
	pageDetailsService.activeMenu = _.first(pageDetailsService.menus);

	$scope.pageDetailsService = pageDetailsService;
	$scope.videoService = videoService;

	viewModel.loadTestProgress = new Progress();
	viewModel.loadTestCasesProgress = new Progress();

	viewModel.testCases;
	viewModel.selectedTestCase = null;
	viewModel.testIssues;
	viewModel.selectedTestIssue = null;

	function loadTest() {
		viewModel.loadTestProgress.start("Loading test, wait a sec...");

		var deferred = $q.defer();

		$q(function(resolve, reject) {
			requestService.getTests($routeParams.buildSlug).then(function(data) {
				var testData = _.find(data, {
					id: $routeParams.testID
				});

				if (!testData) {
					pageDetailsService.test = null;

					reject(new Error("Test not found"));
				}
				else {
					pageDetailsService.test = new Test();
					pageDetailsService.test.state = Test.stateFromTestData(testData);
					pageDetailsService.test.deviceName = testData.deviceName;
					pageDetailsService.test.apiLevel = testData.apiLevel;
					pageDetailsService.test.durationInSeconds = testData.durationInSeconds;
					pageDetailsService.test.orientation = Test.orientation(testData.orientation);
					pageDetailsService.test.locale = testData.locale;
					pageDetailsService.test.testSuiteXMLurl = testData.testSuiteXMLurl;
					pageDetailsService.test.videoURL = testData.videoURL;
					pageDetailsService.test.screenshotURLs = testData.screenshotURLs;
					pageDetailsService.test.activityMapURL = testData.activityMapURL;
					pageDetailsService.test.logsURL = testData.logsURL;
					pageDetailsService.test.fileURLs = testData.fileURLs;

					pageDetailsService.test.issues = testData.issues ? _.map(testData.issues, function(aTestIssueData) {
						var testIssue = new TestIssue();
						testIssue.name = aTestIssueData.name;
						testIssue.stacktrace = aTestIssueData.stacktrace;

						return testIssue;
					}) : [];

					resolve();
				}
			}, function(error) {
				reject(new Error("Error loading test."));
			});
		}).then(function() {
			viewModel.loadTestProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);

			deferred.resolve();
		}, function(error) {
			viewModel.loadTestProgress.error(error);

			deferred.reject(error);
		});

		return deferred.promise;
	}

	function loadTestCases() {
		viewModel.loadTestCasesProgress.start("Loading test cases, wait a sec...");

		requestService.getXMLfromURL(pageDetailsService.test.testSuiteXMLurl).then(function(xml) {
			viewModel.testCases = _.map($($.parseXML(xml)).find("testsuite").find("testcase"), function(aTestCaseData) {
				var testCase = new TestCase();
				testCase.name = $(aTestCaseData).attr("name");
				testCase.package = $(aTestCaseData).attr("classname");

				if ($(aTestCaseData).find("failure").length > 0) {
					testCase.state = TestCase.stateFromStateID("failed");
					testCase.stackTrace = $(aTestCaseData).find("failure").text();
				}
				else {
					testCase.state = TestCase.stateFromStateID("passed");
				}

				return testCase;
			});

			viewModel.loadTestCasesProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);
		}, function(error) {
			viewModel.loadTestCasesProgress.error(new Error("Error loading test cases."));
		});
	}

	viewModel.testCaseSelected = function(testCase) {
		viewModel.selectedTestCase = viewModel.selectedTestCase == testCase ? null : testCase;

		$timeout(function() {
			iframeService.sendSize();
		}, 50);
	};

	viewModel.testIssueSelected = function(testIssue) {
		viewModel.selectedTestIssue = viewModel.selectedTestIssue == testIssue ? null : testIssue;

		$timeout(function() {
			iframeService.sendSize();
		}, 50);
	};

	$q(function(resolve, reject) {
		if (!pageDetailsService.test) {
			loadTest().then(resolve, function() {});
		}
		else {
			viewModel.loadTestProgress.success();

			resolve();
		}
	}).then(function() {
		if (pageDetailsService.test.testSuiteXMLurl) {
			loadTestCases();
		}
	});


	$scope.$on("$destroy", function() {
		pageDetailsService.reset();
	});

}).service("pageDetailsService", function() {

	var pageDetailsService = {
		menus: [{
			cssClass: "test-cases",
			targetAnchor: "test-cases"
		}, {
			cssClass: "video",
			targetAnchor: "video"
		},/* {
			cssClass: "metrics",
			targetAnchor: "metrics"
		},*/ {
			cssClass: "logs",
			targetAnchor: "logs"
		}],
		activeMenu: undefined,
		menuSelected: function(menu) {

		},
		test: undefined,
		logs: undefined
	};

	pageDetailsService.reset = function() {
		pageDetailsService.activeMenu = undefined;
		pageDetailsService.menuSelected = function(menu) {

		};
		pageDetailsService.test = undefined;
		pageDetailsService.logs = undefined;
	};

	return pageDetailsService;

}).directive("pageDetailsMenu", function(iframeService, pageDetailsService) {

	return {
		restrict: "A",
		link: function(scope, element, attrs) {

			pageDetailsService.menuSelected = function(menu) {
				var targetSection = $("section#" + menu.targetAnchor);

				var scrollPositionY = targetSection.offset().top - (element.offset().top - $(window).scrollTop());

				$("html, body").animate({
					scrollTop: scrollPositionY
				}, 500);
			};

			function handleScroll() {
				var menuButtonIDs = [
					"#test-cases",
					"#video",
					// "#metrics",
					"#logs"
				];

				$(menuButtonIDs.join()).each(function(index) {
					if ($(this).offset().top > element.offset().top) {
						return false;
					}

					pageDetailsService.activeMenu = pageDetailsService.menus[index];

					scope.$apply();
				});
			};

			$(window).bind("scroll", handleScroll);

			scope.$on("$destroy", function() {
				$(window).unbind("scroll", handleScroll);
			});
		}
	};

});

})();
