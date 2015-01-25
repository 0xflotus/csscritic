describe("Url Query Filter", function () {
    "use strict";

    var windowLocation;

    var setFilter = function (filter) {
        windowLocation.search = '?filter=' + filter;
    };

    var aComparison = function (url) {
        return {
            testCase: {
                url: url
            }
        };
    };

    beforeEach(function () {
        windowLocation = {
            search: ''
        };

    });

    describe("selection", function () {
        it("should provide a filter url", function () {
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);
            expect(urlQueryFilter.filterUrlFor('aUrl.html')).toEqual('?filter=aUrl.html');
        });

        it("should respect existing parameters", function () {
            windowLocation.search = '?some=other&val=ues';
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);
            expect(urlQueryFilter.filterUrlFor('aUrl.html')).toEqual('?some=other&val=ues&filter=aUrl.html');
        });

        it("should respect existing filter parameter", function () {
            windowLocation.search = '?some=other&filter=something&val=ues';
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);
            expect(urlQueryFilter.filterUrlFor('aUrl.html')).toEqual('?some=other&val=ues&filter=aUrl.html');
        });

        it("should deal with duplicate filter parameter", function () {
            windowLocation.search = '?some=other&filter=something&val=ues&filter=someMore';
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);
            expect(urlQueryFilter.filterUrlFor('aUrl.html')).toEqual('?some=other&val=ues&filter=aUrl.html');
        });
    });

    describe("clearing", function () {
        it("should provide a clear selection url", function () {
            setFilter('aSelection');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.clearFilterUrl()).toEqual('?');
        });

        it("should respect existing parameters", function () {
            windowLocation.search = '?some=other&val=ues&filter=aSelection';
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.clearFilterUrl()).toEqual('?some=other&val=ues');
        });

        it("should deal with duplicate filter parameters", function () {
            windowLocation.search = '?some=other&filter=something&val=ues&filter=aSelection';
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.clearFilterUrl()).toEqual('?some=other&val=ues');
        });
    });

    describe("filtering", function () {
        it("should find a comparison by URL", function () {
            var comparison = aComparison('aTest');
            setFilter('aTest');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(comparison)).toBe(true);
        });

        it("should filter out a comparison if URL does not match", function () {
            var comparison = aComparison('aTest');
            setFilter('someOtherTest');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(comparison)).toBe(false);
        });

        it("should handle encoded URI", function () {
            var comparison = aComparison('a/Test.html');
            setFilter('a%2FTest.html');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(comparison)).toBe(true);
        });

        it("should not filter if no query given", function () {
            var firstComparison = aComparison('firstComparison');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(firstComparison)).toBe(true);
        });

        it("should not filter if an empty filter is given", function () {
            var firstComparison = aComparison('firstComparison');
            setFilter('');
            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(firstComparison)).toBe(true);
        });

        it("should match last filter value", function () {
            var firstComparison = aComparison('one'),
                secondComparison = aComparison('two');
            windowLocation.search = '?filter=one&filter=two';

            var urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

            expect(urlQueryFilter.isComparisonSelected(firstComparison)).toBe(false);
            expect(urlQueryFilter.isComparisonSelected(secondComparison)).toBe(true);
        });
    });
});
