(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").factory("TestCase", function() {

	var TestCase = function() {
		this.name;
		this.package;
		this.state;
		this.stackTrace;
		this.logs;
	};

	TestCase.stateFromStateID = function(stateID) {
		switch (stateID) {
			case "passed":
				return {
					id: "passed",
					cssClass: "passed"
				}
			case "failed":
				return {
					id: "failed",
					cssClass: "failed"
				}
		}
	};

	return TestCase;

});

})();
