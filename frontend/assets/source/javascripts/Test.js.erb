(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").factory("Test", function() {

	var Test = function() {
		this.id;
		this.deviceName;
		this.apiLevel;
		this.durationInSeconds;
		this.testCaseCount;
		this.failedTestCaseCount;
		this.orientation;
		this.locale;
		this.state;
		this.issues;
		this.testSuiteXMLurl;
		this.videoURL;
		this.screenshotURLs;
		this.activityMapURL;
		this.logsURL;
	};

	Test.stateFromTestData = function(testData) {
		var stateID;

		switch (testData.status) {
			case "pending":
			case "inProgress":
				stateID = "in_progress";

				break;
			case "complete":
				if (testData.outcome == "inconclusive") {
					stateID = "inconclusive";

					break;
				}

				if (testData.outcome == "skipped") {
					stateID = "skipped";

					break;
				}

				if (testData.outcome == "failure") {
					stateID = "failed";

					break;
				}

				if (testData.outcome == "success") {
					stateID = "passed";

					break;
				}

				stateID = testData.failedTestCaseCount > 0 ? "failed" : "passed";

				break;
		}

		return _.find(Test.states, {
			id: stateID
		});
	};

	Test.orientation = function(orientationID) {
		switch (orientationID) {
			case "portrait":
				return {
					name: "portrait",
					cssClass: "portrait"
				};
			case "landscape":
				return {
					name: "landscape",
					cssClass: "landscape"
				};
		}
	};

	Test.states = [{
		id: "in_progress",
		cssClass: "in-progress",
		text: "inProgress"
	}, {
		id: "failed",
		cssClass: "failed",
		text: "failed"
	}, {
		id: "passed",
		cssClass: "passed",
		text: "passed"
	}, {
		id: "skipped",
		cssClass: "skipped",
		text: "skipped"
	}, {
		id: "inconclusive",
		cssClass: "inconclusive",
		text: "inconclusive"
	}];

	return Test;

});

})();
