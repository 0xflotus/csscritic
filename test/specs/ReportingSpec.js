describe("Reporting", function () {
    "use strict";

    var rendererBackend, storageBackend, reporting;

    var util = csscriticLib.util();

    var htmlImage, referenceImage;

    var setUpRenderedImage = function (image, errors) {
        errors = errors || [];
        rendererBackend.render.and.returnValue(testHelper.successfulPromiseFake({
            image: image,
            errors: errors
        }));
    };

    var triggerDelayedPromise = function () {
        jasmine.clock().tick(100);
    };

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    beforeEach(function () {
        htmlImage = "the_html_image";
        referenceImage = "the_reference_image";

        rendererBackend = jasmine.createSpyObj('renderer', ['render']);
        storageBackend = jasmine.createSpyObj('storageBackend', ['readReferenceImage', 'storeReferenceImage']);

        reporting = csscriticLib.reporting(rendererBackend, storageBackend, util);
    });

    describe("reportComparisonStarting", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparisonStarting"]);
        });

        it("should report a starting comparison", function () {
            reporting.doReportComparisonStarting([reporter], [{
                url: "samplepage.html"
            }]);

            expect(reporter.reportComparisonStarting).toHaveBeenCalledWith({
                testCase: {
                    url: "samplepage.html"
                }
            });
        });

        it("should make method optional", function () {
            var startingComparison = "blah",
                emptyReporter = {};

            reporting.doReportComparisonStarting([emptyReporter], [startingComparison]);
        });

        it("should only fulfill once the reporter returned", function () {
            var startingComparison = "blah",
                defer = testHelper.deferFake(),
                callback = jasmine.createSpy('callback');

            reporter.reportComparisonStarting.and.returnValue(defer.promise);

            reporting.doReportComparisonStarting([reporter], [startingComparison]).then(callback);

            triggerDelayedPromise();

            expect(callback).not.toHaveBeenCalled();
            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

    });

    describe("reportComparison", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);
        });

        it("should make method optional", function () {
            var comparison = "blah",
                emptyReporter = {};

            reporting.doReportComparison([emptyReporter], [comparison]);
        });

        it("should only fulfill once the reporter returned", function () {
            var defer = testHelper.deferFake(),
                comparison = "blah",
                callback = jasmine.createSpy('callback');

            reporter.reportComparison.and.returnValue(defer.promise);

            reporting.doReportComparison([reporter], comparison).then(callback);

            triggerDelayedPromise();

            expect(callback).not.toHaveBeenCalled();
            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

        it("should report a successful comparison", function () {
            reporting.doReportComparison([reporter], {
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: referenceImage,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should report a failing comparison", function () {
            reporting.doReportComparison([reporter], {
                status: "failed",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: referenceImage,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.objectContaining({
                status: "failed"
            }));
        });

        it("should report a missing reference image", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            });
        });

        it("should report an error if the page does not exist", function () {
            reporting.doReportComparison([reporter], {
                status: "error",
                testCase: {
                    url: "differentpage.html"
                }
            });

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: undefined
            });
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = "newHtmlImage",
                result;

            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            setUpRenderedImage(newHtmlImage);

            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                url: "differentpage.html",
                width: 16,
                height: 34
            }));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should pass the test case's additional parameters on resize", function () {
            setUpRenderedImage(htmlImage);

            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html",
                    hover: '.selector'
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            reporter.reportComparison.calls.mostRecent().args[0].resizePageImage(16, 34, function () {});

            expect(rendererBackend.render).toHaveBeenCalledWith(
                jasmine.objectContaining({hover: '.selector'})
            );
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith({url: "differentpage.html"}, htmlImage, jasmine.any(Object));
        });

        it("should store the viewport's size on accept", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(jasmine.any(Object), htmlImage, {
                width: 42,
                height: 21
            });
        });

        it("should pass the test case's additional parameters on accept", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html",
                    hover: '.selector'
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(
                jasmine.objectContaining({hover: '.selector'}),
                htmlImage,
                jasmine.any(Object)
            );
        });

        it("should store the viewport's updated size on accept", function () {
            setUpRenderedImage(htmlImage);

            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html",
                    hover: '.selector'
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            var result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {});

            result.acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(jasmine.any(Object), htmlImage, {
                width: 16,
                height: 34
            });
        });

        it("should report errors during rendering", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html",
                    hover: '.selector'
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: ["oneUrl", "anotherUrl"],
                viewportWidth: 42,
                viewportHeight: 21
            });

            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.objectContaining({
                renderErrors: ["oneUrl", "anotherUrl"],
            }));
        });

        it("should not pass along a list if no errors exist", function () {
            reporting.doReportComparison([reporter], {
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                htmlImage: htmlImage,
                referenceImage: null,
                renderErrors: [],
                viewportWidth: 42,
                viewportHeight: 21
            });

            expect(reporter.reportComparison).not.toHaveBeenCalledWith(jasmine.objectContaining({
                renderErrors: jasmine.any(Object)
            }));
        });
    });

    describe("report", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["report"]);
        });

        it("should call final report with success", function () {
            reporting.doReportTestSuite([reporter], true);

            expect(reporter.report).toHaveBeenCalledWith({
                success: true
            });
        });

        it("should call final report with failure", function () {
            reporting.doReportTestSuite([reporter], false);

            expect(reporter.report).toHaveBeenCalledWith({
                success: false
            });
        });

        it("should make method optional", function () {
            var emptyReporter = {};
            reporting.doReportTestSuite([emptyReporter], true);
        });

        it("should only fulfill once the reporter returned", function () {
            var defer = testHelper.deferFake(),
                callback = jasmine.createSpy('callback');

            reporter.report.and.returnValue(defer.promise);

            reporting.doReportTestSuite([reporter], true).then(callback);

            triggerDelayedPromise();

            expect(callback).not.toHaveBeenCalled();
            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

    });
});
