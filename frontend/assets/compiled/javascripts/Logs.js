(function() {

"use strict";

angular.module("BitriseAddonFirebaseApp").controller("LogsController", function($scope, $timeout, iframeService, requestService, pageDetailsService, Progress) {

	var viewModel = this;

	$scope.pageDetailsService = pageDetailsService;

	viewModel.loadLogsProgress = new Progress();
	viewModel.isLogTypeFilterVisible = false;
	viewModel.logTypeFilters = [{
		id: "all",
		name: "All logs"
	}, {
		id: "info+",
		name: "Info & higher"
	}, {
		id: "warning+",
		name: "Warning & higher"
	}, {
		id: "error+",
		name: "Error & higher"
	}];
	viewModel.selectedLogTypeFilter = _.find(viewModel.logTypeFilters, {
		id: "warning+"
	});
	viewModel.pagination = {
		pages: undefined,
		pageCount: undefined,
		linesPerPage: 50,
		selectedPage: undefined
	};

	var unwatchTest = $scope.$watch(function() {
		return pageDetailsService.test;
	}, function(test) {
		if (!test) {
			return;
		}

		loadLogs();
		unwatchTest();
	});

	function loadLogs() {
		viewModel.loadLogsProgress.start("Loading logs, wait a sec...");

		requestService.getLogfromURL(pageDetailsService.test.logsURL).then(function(data) {
			pageDetailsService.logs = processedLogs(data);
			viewModel.pagination.selectedPage = 1;

			viewModel.loadLogsProgress.success();

			$timeout(function() {
				iframeService.sendSize();
			}, 50);
		}, function(error) {
			viewModel.loadLogsProgress.error(new Error("Error loading logs."));
		});
	}

	function processedLogs(rawLogs) {
		return _.map(_.filter(rawLogs.split("\n"), function(aRawLogLine) {
			return aRawLogLine;
		}), function(aRawLogLine) {
			if (!aRawLogLine) {
				return null;
			}

			try {
				var regexp = new RegExp(/^([0-9]+)-([0-9]+) ([0-9]+)\:([0-9]+)\:([0-9]+)\.([0-9]+)\: (?:[0-9]+\-[0-9]+\/.+ |)([V|D|I|W|E|A])\/(.+)\([0-9]+\)\: (.+)$/);
				var month = regexp.exec(aRawLogLine)[1];
				var day = regexp.exec(aRawLogLine)[2];
				var hour = regexp.exec(aRawLogLine)[3];
				var minute = regexp.exec(aRawLogLine)[4];
				var second = regexp.exec(aRawLogLine)[5];
				var millisecond = regexp.exec(aRawLogLine)[6];
				var type;

				switch (regexp.exec(aRawLogLine)[7]) {
					case "V":
						type = {
							id: "verbose",
							cssClass: "verbose"
						};

						break;
					case "D":
						type = {
							id: "debug",
							cssClass: "debug"
						};

						break;
					case "I":
						type = {
							id: "info",
							cssClass: "info"
						};

						break;
					case "W":
						type = {
							id: "warning",
							cssClass: "warning"
						};

						break;
					case "E":
						type = {
							id: "error",
							cssClass: "error"
						};

						break;
					case "A":
						type = {
							id: "assert",
							cssClass: "assert"
						};

						break;
				}

				var tag = regexp.exec(aRawLogLine)[8];
				var message = regexp.exec(aRawLogLine)[9];

				var date = new Date(new Date().getFullYear(), month, day, hour, minute, second, millisecond);

				return {
					date: date,
					type: type,
					tag: tag,
					message: message,
					isProcessed: true,
					isExpanded: false
				};
			}
			catch (error) {
				var type = {
					id: "verbose",
					cssClass: "verbose"
				};

				viewModel.selectedLogTypeFilter = _.find(viewModel.logTypeFilters, {
					id: "all"
				});

				viewModel.logTypeFilters = [{
					id: "all",
					name: "All logs"
				}]

				return {
					date: undefined,
					type: type,
					tag: undefined,
					message: aRawLogLine,
					isProcessed: true,
					isExpanded: false
				};
			}
		});
	}

	viewModel.logTypeFilterSelected = function(logTypeFilter) {
		viewModel.selectedLogTypeFilter = logTypeFilter;
		viewModel.isLogTypeFilterVisible = false;

		$timeout(function() {
			iframeService.sendSize();
		}, 50);
	};

	viewModel.filteredLogs = function() {
		return _.filter(pageDetailsService.logs, function(aLogLine) {
			if (!aLogLine.isProcessed) {
				return false;
			}

			switch (viewModel.selectedLogTypeFilter.id) {
				case "all":
					return _.contains(["verbose", "debug", "info", "warning", "error", "assert"], aLogLine.type.id);
				case "info+":
					return _.contains(["info", "warning", "error", "assert"], aLogLine.type.id);
				case "warning+":
					return _.contains(["warning", "error", "assert"], aLogLine.type.id);
				case "error+":
					return _.contains(["error", "assert"], aLogLine.type.id);
			}
		});
	};

	function updatePaginationPages() {
		if (viewModel.pagination.selectedPage === undefined) {
			return;
		}

		viewModel.pagination.pages = [];
		var pageCount = Math.ceil(viewModel.filteredLogs().length / viewModel.pagination.linesPerPage);

		_.each(_.range(1, pageCount + 1), function(page) {
			if (page <= 2) {
				viewModel.pagination.pages.push(page);
			}
			else if (Math.abs(viewModel.pagination.selectedPage - page) <= 2) {
				viewModel.pagination.pages.push(page);
			}
			else if (Math.abs(pageCount - page) < 2) {
				viewModel.pagination.pages.push(page);
			}
		});

		_.each(_.range(1, pageCount + 1), function(page) {
			if (_.contains(viewModel.pagination.pages, page)) {
				return;
			}

			if (_.contains(viewModel.pagination.pages, page - 1) && _.contains(viewModel.pagination.pages, page + 1)) {
				viewModel.pagination.pages.splice(_.indexOf(viewModel.pagination.pages, page - 1) + 1, 0, page);
			}
		});

		$timeout(function() {
			iframeService.sendSize();
		}, 50);
	}

	$scope.$watch(function() {
		return pageDetailsService.logs;
	}, function(selectedPage) {
		updatePaginationPages();
	});

	$scope.$watch(function() {
		return viewModel.selectedLogTypeFilter;
	}, function(selectedPage) {
		var oldSelectedPage = viewModel.pagination.selectedPage;
		viewModel.pagination.selectedPage = 1;

		if (oldSelectedPage == viewModel.pagination.selectedPage) {
			updatePaginationPages();
		}
	});

	$scope.$watch(function() {
		return viewModel.pagination.selectedPage;
	}, function(selectedPage) {
		updatePaginationPages();
	});

});

})();
