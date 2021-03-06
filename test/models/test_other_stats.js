'use strict';

describe('Other Stats Model', function() {
    //Clean up after each test.
    afterEach(function() {
        simple.restore();
    });

    describe('Instance Methods', function() {
        describe('Clear', function() {
            it('should clear all the values in stats', function() {
                var os = new OtherStats();
                os.ac(20);
                os.ac().should.equal(20);
                os.clear();
                os.ac().should.equal(10);
            });
        });

        describe('Import', function() {
            it('should import all the values in other stats', function() {
                var os = new OtherStats();
                os.ac(20);
                os.initiative(-23);
                os.speed(20);

                var e = os.exportValues();
                e.ac.should.equal(20);
                e.initiative.should.equal(-23);
                e.speed.should.equal(20);

                var os2 = new OtherStats();
                os2.importValues(e);
                e.ac.should.equal(20);
                e.initiative.should.equal(-23);
                e.speed.should.equal(20);

            });
        });

        describe('Export', function() {
            it('should export all the values in other stats', function() {
                var os = new OtherStats();
                os.ac(20);
                os.initiative(-23);
                os.speed(20);

                var e = os.exportValues();
                e.ac.should.equal(20);
                e.initiative.should.equal(-23);
                e.speed.should.equal(20);
            });
        });

        describe('Save', function() {
            it('should save the values to the local store', function() {
                var os = new OtherStats();
                var saved = false;
                os.ps.save = function() { saved = true; };
                saved.should.equal(false);

                os.save();
                saved.should.equal(true);
            });
        });
    });
});
