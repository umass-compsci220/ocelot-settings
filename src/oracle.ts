function oracle(config) {
  // Returns true if input candidate prefers company 1 to company 2
  function prefers(company1: any, company2: any, candidate: any, candidates: any[]) {
    return candidates[candidate].indexOf(company1) < candidates[candidate].indexOf(company2);
  }

  // Get index of input company in hires array
  function getCompanyIndex(company: any, hires: any[]) {
    for (let i = 0; i < hires.length; ++i) {
      if (hires[i].company === company) {
        return i;
      }
    }
    // If we haven't found a company yet, return -1
    return -1;
  }

  // Remove the first hire with the input company from the hires list
  function unHire(company: any, hires: any[], hasHired: any[]) {
    hasHired[company] = false;
    hires.splice(getCompanyIndex(company, hires), 1);
  }

  // Get company that hired input candidate
  function getCompany(candidateNum: any, hires: any) {
    for (let i = 0; i < hires.length; ++i) {
      if (hires[i].candidate === candidateNum) {
        return hires[i].company;
      }
    }

    // If we haven't found a candidate yet, return -1 to crash the program
    // console.log("getCompany: There is no company associated with input candidate");
    return -1;
  }

  const obj = {
    hire: (comp: any, cand: any) => {
      return { company: comp, candidate: cand };
    },
    wheat1: function(companies: any[], candidates: any[]) {
      // Gale-Shapley Algorithm
      const n = companies.length,
            hires = [];
      // True in this array implies that there is a provisional hiring
      const hasHired = Array(n).fill(false),  // Company List
            wasHired = Array(n).fill(false);  // Candidate List
      // The number of times each company has attempted to hire a candidate
      const proposalCounts = Array(n).fill(0);

      let nextCompany = hasHired.indexOf(false);
      while (nextCompany !== -1) {
        const preferredCandidate = companies[nextCompany][proposalCounts[nextCompany]];
        if (!wasHired[preferredCandidate]) {
          // Candidate was free
          wasHired[preferredCandidate] = true;
          hasHired[nextCompany] = true;
          hires.push(obj.hire(nextCompany, preferredCandidate));
        } else {
          // Candidate has already been hired
          const competitor = getCompany(preferredCandidate, hires);
          if (prefers(nextCompany, competitor, preferredCandidate, candidates)) {
            unHire(competitor, hires, hasHired);
            hasHired[nextCompany] = true;
            hires.push(obj.hire(nextCompany, preferredCandidate));
          }
        }
        ++proposalCounts[nextCompany];
        nextCompany = hasHired.indexOf(false);
      }

      return config.stopifyArray(hires);
    },
    chaff1: function(companies: any) {
      return companies.reduce((acc: any, x: any) => {
        acc.hires.push(obj.hire(acc.n, acc.n));
        ++acc.n;
        return acc;
      }, {
        hires: config.stopifyArray([]),
        n: 0
      }).hires;
    },
    traceWheat1: function(companies: any[], candidates: any[]) {
      // These are parameters. Affects how algorithm runs
      const maxIterations = Infinity;
      // If true, will always prefer to have a company propose
      const preferComp = true;
      // If true and !preferComp, will randomly pick whether company or candidate proposes
      const randomPreference = false;
      // If true, will select proposer at random from valid proposers
      // (exhausts whichever is selected as preference before trying the second)
      const randomProposer = false;
      // If true and randomProposer is false, will propose lowest index valid proposer, else will propose highest
      const forwardProposer = false;

      // This is boilerplate. Will not change per algorithm
      let currIterations = 0;
      const hires: any[] = [];
      const trace: any[] = [];
      const n = companies.length;
      const copyPreferences = (list: any[]) =>
        list.reduce((acc: any[], elem: any) => { acc.push(elem.slice(0, elem.length)); return acc; }, []);

      const comp = copyPreferences(companies);
      const cand = copyPreferences(candidates);

      // Queue that cannot be pushed to after it is created.
      // One function, pop, that returns next element
      class Queue {
        private copy: any[];
        public constructor(list: any[]) {
          this.copy = list.slice(0, list.length);
        }
        public pop() { return this.copy.shift(); }
        public isEmpty() { return this.copy.length === 0; }
      }

      function offer(from: number, to: number, fromCo: boolean) {
        return {from: from, to: to, fromCo: fromCo};
      }

      function hireFromOffer(o: any) {
        return obj.hire(o.fromCo ? o.from : o.to, o.fromCo ? o.to : o.from);
      }

      function makeProposalQueues(preferences: any[]) {
        return preferences.reduce((acc, elem) => { acc.push(new Queue(elem)); return acc; }, []);
      }

      function allEmpty(queues: any[]) {
        return queues.reduce((acc, elem) => acc && elem.isEmpty(), true);
      }

      const compQueues = makeProposalQueues(comp);
      const candQueues = makeProposalQueues(cand);

      function findHire(id: number, isComp: boolean) {
        const check = (elem: any) => isComp ? elem.company === id : elem.candidate === id;
        return hires.reduce((acc: any, elem: any) => acc.found ? acc
                                                               : (check(elem) ? {found: true, index: acc.index}
                                                                              : {found: false, index: acc.index + 1}),
                            {found: false, index: 0});
      }

      function getHire(id: number, isComp: boolean) {
        const location = findHire(id, isComp);
        return {found: location.found, hire: location.found ? hires[location.index] : {}};
      }

      function canPropose(id: number, isComp: boolean) {
        return !findHire(id, isComp).found;
      }

      // Returns an array of integers from n to m-1
      function range(start: number, end: number) {
        const array = [];
        for (let i = start; i < end; ++i) {
          array.push(i);
        }
        return array;
      }

      // Returns a random int i where min <= i < max
      function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
      }

      function randomElement(list: any[]) {
        return list.length === 0 ? undefined : list[randomInt(0, list.length)];
      }

      function getValidProposers(isComp: boolean) {
        return range(0, n).filter((elem) => canPropose(elem, isComp)).filter(elem => isComp
                                                                                       ? !compQueues[elem].isEmpty()
                                                                                       : !candQueues[elem].isEmpty());
      }

      function localPrefers(potentialMatch: number, currMatch: number, preferences: any[]) {
        return preferences.indexOf(potentialMatch) < preferences.indexOf(currMatch);
      }

      // These may vary per algorithm
      function getNextProposal() {
        let first = comp;
        let second = cand;
        let firstQueues = compQueues;
        let secondQueues = candQueues;
        let compFirst = true;

        if (!preferComp && randomPreference && Math.random() < 0.5) {
          first = cand;
          second = comp;
          firstQueues = candQueues;
          secondQueues = compQueues;
          compFirst = false;
        }

        const validFirsts = getValidProposers(compFirst);
        const validSeconds = getValidProposers(!compFirst);

        if (validFirsts.length !== 0) {
          const proposer = randomProposer ? randomElement(validFirsts)
                                        : (forwardProposer ? validFirsts[0]
                                                           : validFirsts[validFirsts.length - 1]);
          return {found: true, offer: offer(proposer, firstQueues[proposer].pop(), compFirst)};
        } else if (validSeconds.length !== 0) {
          const proposer = randomProposer ? randomElement(validSeconds)
                                        :  (forwardProposer ? validSeconds[0]
                                                            : validSeconds[validSeconds.length - 1]);
          return {found: true, offer: offer(proposer, secondQueues[proposer].pop(), !compFirst)};
        } else {
          return {found: false};
        }
       }

      function updateHires(proposal: any) {
        const currHire = getHire(proposal.to, !proposal.fromCo);
        if (!currHire.found) {
          hires.push(obj.hire(proposal.fromCo ? proposal.from :  proposal.to,
                              proposal.fromCo ? proposal.to : proposal.from));
        } else if (localPrefers(proposal.from,
                           !proposal.fromCo ? currHire.hire.candidate : currHire.hire.company,
                           !proposal.fromCo ? comp[proposal.to] : cand[proposal.to])) {
          if (proposal.fromCo) {
            currHire.hire.company = proposal.from;
          } else {
            currHire.hire.candidate = proposal.from;
          }
        }
      }

      // This is the primary algorithm
      while (currIterations < maxIterations &&
             (!allEmpty(compQueues) || !allEmpty(candQueues)) &&
             hires.length !== n) {
        const proposal = getNextProposal();
        if (!proposal.found) {
           break;
        }

        trace.push(proposal.offer);
        updateHires(proposal.offer);
        ++currIterations;
      }
      return {trace: trace, out: hires};
    },
    traceChaff1: function(companies: any[], candidates: any[]) {
      // These are parameters. Affects how algorithm runs
      const maxIterations = Infinity;
      // If true, will always prefer to have a company propose
      const preferComp = true;
      // If true and !preferComp, will randomly pick whether company or candidate proposes
      const randomPreference = false;
      // If true, will select proposer at random from valid proposers
      // (exhausts whichever is selected as preference before trying the second)
      const randomProposer = false;
      // If true and randomProposer is false, will propose lowest index valid proposer, else will propose highest
      const forwardProposer = false;

      // This is boilerplate. Will not change per algorithm
      let currIterations = 0;
      const hires: any[] = [];
      const trace: any[] = [];
      const n = companies.length;
      const copyPreferences = (list: any[]) =>
        list.reduce((acc: any[], elem: any) => { acc.push(elem.slice(0, elem.length)); return acc; }, []);

      const comp = copyPreferences(companies);
      const cand = copyPreferences(candidates);

      // Queue that cannot be pushed to after it is created.
      // One function, pop, that returns next element
      class Queue {
        private copy: any[];
        public constructor(list: any[]) {
          this.copy = list.slice(0, list.length);
        }
        public pop() { return this.copy.shift(); }
        public isEmpty() { return this.copy.length === 0; }
      }

      function offer(from: number, to: number, fromCo: boolean) {
        return {from: from, to: to, fromCo: fromCo};
      }

      function hireFromOffer(o: any) {
        return obj.hire(o.fromCo ? o.from : o.to, o.fromCo ? o.to : o.from);
      }

      function makeProposalQueues(preferences: any[]) {
        return preferences.reduce((acc, elem) => { acc.push(new Queue(elem)); return acc; }, []);
      }

      function allEmpty(queues: any[]) {
        return queues.reduce((acc, elem) => acc && elem.isEmpty(), true);
      }

      const compQueues = makeProposalQueues(comp);
      const candQueues = makeProposalQueues(cand);

      function findHire(id: number, isComp: boolean) {
        const check = (elem: any) => isComp ? elem.company === id : elem.candidate === id;
        return hires.reduce((acc: any, elem: any) => acc.found ? acc
                                                               : (check(elem) ? {found: true, index: acc.index}
                                                                              : {found: false, index: acc.index + 1}),
                            {found: false, index: 0});
      }

      function getHire(id: number, isComp: boolean) {
        const location = findHire(id, isComp);
        return {found: location.found, hire: location.found ? hires[location.index] : {}};
      }

      function canPropose(id: number, isComp: boolean) {
        return !findHire(id, isComp).found;
      }

      // Returns an array of integers from n to m-1
      function range(start: number, end: number) {
        const array = [];
        for (let i = start; i < end; ++i) {
          array.push(i);
        }
        return array;
      }

      // Returns a random int i where min <= i < max
      function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
      }

      function randomElement(list: any[]) {
        return list.length === 0 ? undefined : list[randomInt(0, list.length)];
      }

      function getValidProposers(isComp: boolean) {
        return range(0, n).filter((elem) => canPropose(elem, isComp)).filter(elem => isComp
                                                                                       ? !compQueues[elem].isEmpty()
                                                                                       : !candQueues[elem].isEmpty());
      }

      function localPrefers(potentialMatch: number, currMatch: number, preferences: any[]) {
        // ==========================================
        //                This is the bug
        //                  Should be <
        // ==========================================
        return preferences.indexOf(potentialMatch) > preferences.indexOf(currMatch);
      }

      // These may vary per algorithm
      function getNextProposal() {
        let first = comp;
        let second = cand;
        let firstQueues = compQueues;
        let secondQueues = candQueues;
        let compFirst = true;

        if (!preferComp && randomPreference && Math.random() < 0.5) {
          first = cand;
          second = comp;
          firstQueues = candQueues;
          secondQueues = compQueues;
          compFirst = false;
        }

        const validFirsts = getValidProposers(compFirst);
        const validSeconds = getValidProposers(!compFirst);

        if (validFirsts.length !== 0) {
          const proposer = randomProposer ? randomElement(validFirsts)
                                        : (forwardProposer ? validFirsts[0]
                                                           : validFirsts[validFirsts.length - 1]);
          return {found: true, offer: offer(proposer, firstQueues[proposer].pop(), compFirst)};
        } else if (validSeconds.length !== 0) {
          const proposer = randomProposer ? randomElement(validSeconds)
                                        :  (forwardProposer ? validSeconds[0]
                                                            : validSeconds[validSeconds.length - 1]);
          return {found: true, offer: offer(proposer, secondQueues[proposer].pop(), !compFirst)};
        } else {
          return {found: false};
        }
       }

      function updateHires(proposal: any) {
        const currHire = getHire(proposal.to, !proposal.fromCo);
        if (!currHire.found) {
          hires.push(obj.hire(proposal.fromCo ? proposal.from :  proposal.to,
                              proposal.fromCo ? proposal.to : proposal.from));
        } else if (localPrefers(proposal.from,
                           !proposal.fromCo ? currHire.hire.candidate : currHire.hire.company,
                           !proposal.fromCo ? comp[proposal.to] : cand[proposal.to])) {
          if (proposal.fromCo) {
            currHire.hire.company = proposal.from;
          } else {
            currHire.hire.candidate = proposal.from;
          }
        }
      }

      // This is the primary algorithm
      while (currIterations < maxIterations &&
             (!allEmpty(compQueues) || !allEmpty(candQueues)) &&
             hires.length !== n) {
        const proposal = getNextProposal();
        if (!proposal.found) {
           break;
        }

        trace.push(proposal.offer);
        updateHires(proposal.offer);
        ++currIterations;
      }
      return {trace: trace, out: hires};
    }
  };
  return obj;
}
