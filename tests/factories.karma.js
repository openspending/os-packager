describe('DescribeDataService factory', function() {
    // define variables for the services we want to access in tests
    var DescribeDataService;

    beforeEach(function() {
        // load the module we want to test
        module('Application');

        // inject the services we want to test
        inject(function(_DescribeDataService_) {
            DescribeDataService = _DescribeDataService_;
        });
    });

    describe('#loadSchema()', function() {
        it('should break when no args passed', function() {
            var promise = DescribeDataService.loadSchema();
            return promise.should.be.rejectedWith(Error,
                'Schema file could not be parsed as JSON.');
        });

        it('should break when non-json arg is passed', function() {
            var schema = 'not json';
            var promise = DescribeDataService.loadSchema(schema);
            return promise.should.be.rejectedWith(Error,
                'Schema file could not be parsed as JSON.');
        });

        it('should break when empty object arg is passed', function() {
            var schema = '{}';
            var promise = DescribeDataService.loadSchema(schema);
            return promise.should.be.rejectedWith(Error, 'aggregate error');
        });

        it('should resolve with minimal table schema', function() {
            var schema =
                '{"fields": ' +
                '[{"name": "year","columnType": "date:fiscal-year"}]}';
            var expectedFields =
                [{name: 'year', columnType: 'date:fiscal-year',
                  type: 'string', format: 'default'}];
            var promise = DescribeDataService.loadSchema(schema);
            return Promise.all([
                promise.should.be.fulfilled,
                promise.should.become(expectedFields)
            ]);
        });
        it('should resolve with minimal dataresource schema', function() {
            var schema =
                '{"name": "my_resource",' +
                '"path": "my_resource.csv",' +
                  '"schema": {' +
                    '"fields": [{' +
                        '"name": "year",' +
                        '"columnType": "date:fiscal-year"}]}}';
            var expectedFields =
                [{name: 'year', columnType: 'date:fiscal-year'}];
            var promise = DescribeDataService.loadSchema(schema);
            return Promise.all([
                promise.should.be.fulfilled,
                promise.should.become(expectedFields)
            ]);
        });
        it('should resolve with minimal datapackage schema', function() {
            var schema =
                '{"name": "my_datapackage",' +
                  '"resources": [{' +
                      '"name": "my_resource",' +
                      '"path": "my_resource.csv",' +
                      '"schema": {' +
                        '"fields": [{' +
                            '"name": "year",' +
                            '"columnType": "date:fiscal-year"}]}}]}';
            var expectedFields =
                [{name: 'year', columnType: 'date:fiscal-year'}];
            var promise = DescribeDataService.loadSchema(schema);
            return Promise.all([
                promise.should.be.fulfilled,
                promise.should.become(expectedFields)
            ]);
        });
    });
});
