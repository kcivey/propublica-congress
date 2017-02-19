const {replace, when, verify, object, matchers: {
  anything,
  argThat
}} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

// aliases to verify and when with the ignoreExtraArgs config option set
const ignoringWhen = fakeInvocation => when(fakeInvocation, {ignoreExtraArgs: true});
const ignoringVerify = fakeInvocation => verify(fakeInvocation, {ignoreExtraArgs: true});

describe('pro-publica-congress', () => {
  let clientModule, validators, createPpc;
  beforeEach(() => {
    clientModule = replace('./../src/client');
    validators = replace('./../src/validators');
    createPpc = require('./../src/index').create;

    // validation invocations pass by default
    ignoringWhen(validators.isValidCongress())
      .thenReturn(true);

    ignoringWhen(validators.isValidChamber())
      .thenReturn(true);

    ignoringWhen(validators.isValidType())
      .thenReturn(true);

    ignoringWhen(validators.isValidBillId())
      .thenReturn(true);
    
    ignoringWhen(validators.isValidMemberId())
      .thenReturn(true);
  });

  describe('create()', () => {
    it(
      "sets a 'congress' property to the given argument",
      () => createPpc('SOME_KEY', 115).congress.should.equal(115)
    );

    it('throws with an invalid congress', () => {
      when(validators.isValidCongress(116))
        .thenReturn(false);

      (() => createPpc('SOME_KEY', 116))
        .should.throw(Error, 'Received invalid congress:');
    });

    it("sets a 'client' property to a client created with the given key argument", () => {
      const expectedClient = {};
      when(clientModule.create('SOME_KEY'))
        .thenReturn(expectedClient);

      createPpc('SOME_KEY', 115).client
        .should.equal(expectedClient);
    });
  });

  describe('instance methods', () => {
    let ppc, client;
    beforeEach(() => {
      client = object(['get']);
      when(clientModule.create(anything()))
        .thenReturn(client);

      ignoringWhen(client.get())
        .thenResolve({});

      ppc = createPpc('SOME_KEY', 115);
    });

    describe('.getRecentBills()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '115')
          )));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114})
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '114')
          )));
      });

      it('sets the given chamber as the second element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[1] === 'some_chamber')
          )));
      });

      it("sets 'bills' as the third element of the endpoint", () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[2] === 'bills')
          )));
      });

      it('sets the given recent bill type as the fourth element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[3] === 'some_recent_bill_type')
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });

      it('rejects with an invalid chamber', () => {
        when(validators.isValidChamber('some_chamber'))
          .thenReturn(false);

        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('rejects with an invalid congress', () => {
        ignoringWhen(validators.isValidCongress(114))
          .thenReturn(false);

        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('validates against recent bill types', () => {
        const expectedTypeSet = new Set([
          'introduced',
          'updated',
          'passed',
          'major'
        ]);
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(validators.isValidType(
            'some_recent_bill_type',
            expectedTypeSet
          )));
      });

      it('rejects with an invalid recent bill type', () => {
        ignoringWhen(validators.isValidType('some_recent_bill_type'))
          .thenReturn(false);

        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .should.be.rejectedWith(Error, 'Received invalid recent bill type:');
      });
    });

    describe('.getBill()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getBill('some_bill_id')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '115')
          )));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getBill('some_bill_id', {congress: 114})
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '114')
          )));
      });

      it("sets 'bills' as the second element of the endpoint", () => {
        return ppc.getBill('some_bill_id')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[1] === 'bills')
          )));
      });

      it('sets the given bill ID as the third element of the endpoint', () => {
        return ppc.getBill('some_bill_id')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[2] === 'some_bill_id')
          )));
      });

      it('rejects with an invalid congress', () => {
        ignoringWhen(validators.isValidCongress(114))
          .thenReturn(false);

        return ppc.getBill('some_bill_id', {congress: 114})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getBill('some_bill_id')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('rejects with an invalid bill ID', () => {
        when(validators.isValidBillId('some_bill_id'))
          .thenReturn(false);

        return ppc.getBill('some_bill_id')
          .should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });
    });

    describe('.getAdditionalBillDetails()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '115')
          )));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {congress: 114})
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '114')
          )));
      });

      it("sets 'bills' as the second element of the endpoint", () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => ignoringVerify(
            client.get(argThat(endpoint => endpoint.split('/')[1] === 'bills')
          )));
      });

      it('sets the given bill ID as the third element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[2] === 'some_bill_id')
          )));
      });

      it('sets the given additional bill detail type as the fourth element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[3] === 'some_additional_bill_detail_type')
          )));
      });

      it('rejects with an invalid congress', () => {
        ignoringWhen(validators.isValidCongress(114))
          .thenReturn(false);

        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {congress: 114})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('rejects with an invalid bill ID', () => {
        when(validators.isValidBillId('some_bill_id'))
          .thenReturn(false);

        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });

      it('validates against recent bill types', () => {
        const expectedAdditionalBillDetailTypes = new Set([
          'subjects',
          'amendments',
          'related',
          'cosponsors'
        ]);
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(validators.isValidType(
            'some_additional_bill_detail_type',
            expectedAdditionalBillDetailTypes
          )));
      });

      it('rejects with an invalid recent bill type', () => {
        ignoringWhen(validators.isValidType('some_additional_bill_detail_type'))
          .thenReturn(false);

        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .should.be.rejectedWith(Error, 'Received invalid additional bill detail type:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });
    });
    
    describe('.getMemberList()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getMemberList('some_chamber')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '115')
          )));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getMemberList('some_chamber', {congress: 114})
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === '114')
          )));
      });

      it('sets the given chamber as the second element of the endpoint', () => {
        return ppc.getMemberList('some_chamber')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[1] === 'some_chamber')
          )));
      });

      it("sets 'members' as the third element of the endpoint", () => {
        return ppc.getMemberList('some_chamber')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[2] === 'members')
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getMemberList('some_chamber')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getMemberList('some_chamber', {offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });

      it('rejects with an invalid chamber', () => {
        when(validators.isValidChamber('some_chamber'))
          .thenReturn(false);

        return ppc.getMemberList('some_chamber')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('validates against the 102nd congress as the earliest for the house', () => {
        return ppc.getMemberList('house')
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it('reject on house lists before the 102nd congress', () => {
        when(validators.isValidCongress(100, 102))
          .thenReturn(false);

        return ppc.getMemberList('house', {congress: 100})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('reject on senate lists before the 80th congress', () => {
        when(validators.isValidCongress(70, 80))
          .thenReturn(false);

        return ppc.getMemberList('senate', {congress: 70})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 80th congress as the earliest for the senate', () => {
        return ppc.getMemberList('senate')
          .then(() => verify(validators.isValidCongress(
            anything(),
            80
          )));
      });
    });

    describe('.getNewMembers()', () => {
      it("sets 'members' as the first element of the endpoint", () => {
        return ppc.getNewMembers()
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === 'members')
          )));
      });

      it("sets 'new' as the second element of the endpoint", () => {
        return ppc.getNewMembers()
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[1] === 'new')
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getNewMembers()
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getNewMembers({offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });
    });

    describe('.getVotesByMember()', () => {
      it("sets 'members' as the first element of the endpoint", () => {
        return ppc.getVotesByMember('some_member_id')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[0] === 'members')
          )));
      });

      it('sets the given member ID as the second element of the endpoint', () => {
        return ppc.getVotesByMember('some_member_id')
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint.split('/')[1] === 'some_member_id')
          )));
      }); 

      it('rejects with an invalid member ID', () => {
        when(validators.isValidMemberId('some_member_id'))
          .thenReturn(false);

        return ppc.getVotesByMember('some_member_id')
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getVotesByMember('some_member_id')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getVotesByMember('some_member_id', {offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });
    });

    describe('.getMemberComparison()', () => {
      /**
       * Helper to minimize repeating this multi-line invocation. Wraps around the call to 
       * ppc.getMemberComparison using an options hash whose keys map to the arguments of the method
       * the required parameters have default values set which may or may not be referenced in a
       * test. They may also be overridden for the purposes of the test.
       * 
       * @param {Object} [{
       *         firstMemberId = 'some_member_id',
       *         secondMemberId = 'some_other_member_id',
       *         chamber = 'some_chamber',
       *         memberComparisonType = 'some_member_comparison_type',
       *         congress,
       *         offset
       *       }={}] 
       * @returns 
       */
      function getMemberComparison({
        firstMemberId = 'some_member_id',
        secondMemberId = 'some_other_member_id',
        chamber = 'some_chamber',
        memberComparisonType = 'some_member_comparison_type',
        congress,
        offset
      } = {}) {
        return ppc.getMemberComparison(
          firstMemberId,
          secondMemberId,
          chamber,
          memberComparisonType,
          Object.assign({}, congress ? {congress} : {}, offset ? {offset} : {})
        );
      }

      it("makes request to an endpoint resembling 'members/{first-member-id}/{member-comparison-type}/{second-member-id}/{congress}/{chamber}'", () => {
        return getMemberComparison()
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint === 'members/some_member_id/some_member_comparison_type/some_other_member_id/115/some_chamber')
          )));
      });

      it("makes request to an endpoint respecting the given congress", () => {
        return getMemberComparison({congress: 114})
          .then(() => ignoringVerify(client.get(
            argThat(endpoint => endpoint === 'members/some_member_id/some_member_comparison_type/some_other_member_id/114/some_chamber')
          )));
      });

      it('sets the offset to 0 by default', () => {
        return getMemberComparison()
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return getMemberComparison({offset: 20})
          .then(() => verify(client.get(
            anything(),
            20
          )));
      });

      it('rejects with an invalid first member ID', () => {
        when(validators.isValidMemberId('some_member_id'))
          .thenReturn(false);

        return getMemberComparison()
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('rejects with an invalid second member ID', () => {
        when(validators.isValidMemberId('some_other_member_id'))
          .thenReturn(false);

        return getMemberComparison()
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('rejects with an invalid chamber', () => {
        when(validators.isValidChamber('some_chamber'))
          .thenReturn(false);

        return getMemberComparison()
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('validates against the 101st congress as the earliest for the senate', () => {
        return getMemberComparison({chamber: 'senate'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            101
          )));
      });

      it('validates against the 102nd congress as the earliest for the house', () => {
        return getMemberComparison({chamber: 'house'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it('rejects with representative comparisons before the 102nd congress', () => {
        when(validators.isValidCongress(100, 102))
          .thenReturn(false);

        return getMemberComparison({chamber: 'house', congress: 100})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('rejects with senator comparisons before the 101st congress', () => {
        when(validators.isValidCongress(70, 101))
          .thenReturn(false);

        return getMemberComparison({chamber: 'senate', congress: 70})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against member comparison types', () => {
        const expectedTypeSet = new Set([
          'bills',
          'votes',
        ]);
        return getMemberComparison()
          .then(() => verify(validators.isValidType(
            'some_member_comparison_type',
            expectedTypeSet
          )));
      });

      it('rejects with an invalid member comparison type', () => {
        ignoringWhen(validators.isValidType('some_member_comparison_type'))
          .thenReturn(false);

        return getMemberComparison()
          .should.be.rejectedWith(Error, 'Received invalid member comparison type:');
      });
    });

    describe('.getCurrentSenators()', () => {

    });

    describe('.getCurrentRepresentatives()', () => {

    });

    describe('.getLeavingMembers()', () => {

    });

    describe('.getBillsByMember()', () => {

    });

    describe('.getRollCallVotes()', () => {

    });

    describe('.getVotesByDate()', () => {

    });

    describe('.getVotes()', () => {

    });

    describe('.getSenateNominationVotes()', () => {

    });

    describe('.getNominees()', () => {

    });

    describe('.getNominee()', () => {

    });

    describe('.getNomineesByState()', () => {

    });

    describe('.getStatePartyCounts()', () => {

    });

    describe('.getCommittees()', () => {

    });

    describe('.getCommitteeMembership()', () => {

    });
  });
});

