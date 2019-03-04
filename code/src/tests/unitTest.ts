import { DependencyTree, getTopologicalOrder } from "../compiler/passes/passesHelper";
import { getDielIr } from "../lib/cli-compiler";
import { ApplyDependencies, generateDependenciesByName } from "../compiler/passes/dependnecy";

export function testTopologicalSort() {
  const depTree: DependencyTree = new Map([
    ["v1", {
      dependsOn: ["v2"],
      isDependentOn: []
    }],
    ["v2", {
      dependsOn: ["v3"],
      isDependentOn: []
    }],
    ["v3", {
      dependsOn: ["v4"],
      isDependentOn: []
    }],
    ["v4", {
      dependsOn: [],
      isDependentOn: []
    }],
  ]);
  const sorted = getTopologicalOrder(depTree);
  console.log("sorted", sorted);
  if (sorted[0] !== "v4" || sorted[1] !== "v3" || sorted[2] !== "v2" || sorted[3] !== "v1") {
    throw new Error(`testTopologicalSort failed`);
  }
}

//POTENTIAL ISSUES TO LOOK AT:
//multiple views depend on one table
//topological sort array representation doesn't distinguish between nodes at same level vs nodes that depend on each other
//ASK: we're not doing isDependentOn yet, right?
//TODO: refactor dependency graph tests
//TODO: test transitive closure


export function testDependencyGraph() {
  // TODO
  // maybe sahana?
  // feb 22: this is important; maybe do this
  testDepGraph1();
  testDepGraph2a();
  testDepGraph2b();
  testDepGraph3();
}


//test 1: linear dependency graph (view 2 depends on view 1 depends on input table A)
//modification to test 1: made input A into a table to test table dependency functionality
export function testDepGraph1() {
  const q = `
  CREATE TABLE tA (
    ID text,
    Value int
    );

  CREATE VIEW v1
  AS SELECT *
  FROM tA
  ;
  
  CREATE VIEW v2
  AS SELECT *
  FROM v1
  ;`;
  const query_ir = getDielIr(q);
  ApplyDependencies(query_ir);
  const deps = query_ir.dependencies;
  const v1DependsOn = deps.depTree.get('v1').dependsOn;
  const v2DependsOn = deps.depTree.get('v2').dependsOn;

  //dependencies tests for each view
  if (v1DependsOn[0] != 'tA' || v1DependsOn.length != 1) {
      throw new Error('Linear dependency graph (test 1) failed: View 1 should depend on Table A; instead has dependencies '+v1DependsOn);
  }
  if (v2DependsOn[0] != 'v1' || v2DependsOn.length != 1) {
    throw new Error('Linear dependency graph (test 2) failed: View 2 should depend on View 1; instead has dependencies '+v2DependsOn);
  }

  //transitive closure test
  const depsSet = deps.tableDependencies.get('tA');
  if (!depsSet.has('v1') || !depsSet.has('v2') || depsSet.size != 2) {
    throw new Error('Expected v1 and v2 to be dependent on tA; instead got dependencies '+depsSet);
  }

  console.log("Passed all tests for linear dependency graph (test 1).")
}

export function testDepGraph2a() {
  const q = `
  CREATE INPUT tA (
    ID text,
    Value int
  );
  
  CREATE INPUT tB (
    Name text,
    Age int
  );

  CREATE VIEW v1 
  AS SELECT tA.ID, tB.Name
  FROM tA, tB
  WHERE tA.Value = tB.Age
  ;`;
  const query_ir = getDielIr(q);
  
  ApplyDependencies(query_ir);
  const deps = query_ir.dependencies;
  const v1DependsOn = deps.depTree.get('v1').dependsOn;

  //dependency test for view
  if (v1DependsOn[0] != 'tA' || v1DependsOn[1] != 'tB' || v1DependsOn.length != 2) {
    throw new Error('Simple triangle dependency graph (test 2a) failed: View 1 should depend on Tables A and B; instead has dependencies '+v1DependsOn);
  }

  //transitive closure test
  const depsSetA = deps.inputDependencies.get('tA');
  const depsSetB = deps.inputDependencies.get('tB');

  if(!depsSetA.has('v1') || depsSetA.size != 1) {
    throw new Error('tA should only have view 1 dependent on it; instead, dependencies are ' + depsSetA);
  }

  if(!depsSetB.has('v1') || depsSetB.size != 1) {
    throw new Error('tB should only have view 2 dependent on it; instead, dependencies are ' + depsSetB);
  }
  
  console.log("Passed all tests for simple triangular dependency graph (test 2a).")
  
}

//similar to test 2a, but instead of 1 view dependent on 2 tables, has 1 view dependent on 1 table and one view dependent on that view and the table
//the test case itself doesn't really make sense...just want to make sure some tangled joins/dependencies work
export function testDepGraph2b() {
  const q = `
  CREATE INPUT tA (
    ID text,
    Value int
  );

  CREATE VIEW v2 
  AS SELECT * 
  FROM tA
  WHERE Value > 0;

  CREATE VIEW v1
  AS SELECT * 
  FROM tA, v2
  WHERE tA.ID = v2.ID; 
  `;
  const query_ir = getDielIr(q);
  ApplyDependencies(query_ir);
  const deps = query_ir.dependencies;

  const v1DependsOn = deps.depTree.get('v1').dependsOn;
  const v2DependsOn = deps.depTree.get('v2').dependsOn;

  //dependency tests for views
  if(v1DependsOn[0] != 'tA' || v1DependsOn[1] != 'v2' || v1DependsOn.length != 2) {
    throw new Error('View 1 should depend on both table A and view 2 and nothing else; instead has dependencies '+v1DependsOn);
  }
  if(v2DependsOn[0] != 'tA' || v2DependsOn.length != 1) {
    throw new Error('View 2 should depend on just table A; instead has dependencies '+v2DependsOn);
  } 

  //transitive closure test
  const depsSet = deps.inputDependencies.get('tA');
  if(!depsSet.has('v1') || !depsSet.has('v2') || depsSet.size != 2) {
    throw new Error('tA should have views 2 and 1 dependent on it; instead, dependencies are ' + depsSet);
  }
  
  console.log("Passed all tests for connected triangular dependency graph (test 2b).")
}


//m-shaped dependency graph
export function testDepGraph3() {
  const q = `
  CREATE INPUT tA (
    ID text,
    Value int
  );
  CREATE INPUT tB (
    ID text,
    Value int
  );
  CREATE INPUT tC (
    ID text,
    VALUE int
  );

  CREATE VIEW v2 
  AS SELECT *
  FROM tB;

  CREATE VIEW v3 
  AS SELECT *
  FROM tB;

  CREATE VIEW v1
  AS SELECT *
  FROM tA, v2
  WHERE tA.Value = v2.Value;

  CREATE VIEW v4
  AS SELECT *
  FROM v3, tC
  WHERE v3.ID = tC.ID;
  `;
  const query_ir = getDielIr(q);
  ApplyDependencies(query_ir);
  const deps = query_ir.dependencies;

  //dependency tests for views
  const v1DependsOn = deps.depTree.get('v1').dependsOn;
  const v2DependsOn = deps.depTree.get('v2').dependsOn;
  const v3DependsOn = deps.depTree.get('v3').dependsOn;
  const v4DependsOn = deps.depTree.get('v4').dependsOn;

  if (v1DependsOn[0] != 'tA' || v1DependsOn[1] != 'v2' || v1DependsOn.length != 2) {
    throw new Error('View 1 should depend on only table A and view 2; instead has dependencies ' + v1DependsOn);
  }
  if(v2DependsOn[0] != 'tB' || v2DependsOn.length != 1) {
    throw new Error('View 2 should depend on only table B; instead has dependencies ' + v2DependsOn);
  }
  if(v3DependsOn[0] != 'tB' || v3DependsOn.length != 1) {
    throw new Error('View 3 should depend on only table B; instead has dependencies ' + v3DependsOn);
  }
  if(v4DependsOn[0] != 'v3' || v4DependsOn[1] != 'tC' || v4DependsOn.length != 2) {
    throw new Error('View 4 should depend on only table C and view 3; instead has dependencies ' + v4DependsOn);
  }

  //transitive closure tests (all tables influence all views)
  const depsSetA = deps.inputDependencies.get('tA');
  const depsSetB = deps.inputDependencies.get('tB');
  const depsSetC = deps.inputDependencies.get('tC');

  if(!depsSetA.has('v1') || !depsSetA.has('v2') || !depsSetA.has('v3') || !depsSetA.has('v4') || depsSetA.size != 4) {
    throw new Error('All views should depend on table A; instead, found the following depending on table A: '+depsSetA);
  }
  if(!depsSetB.has('v1') || !depsSetB.has('v2') || !depsSetB.has('v3') || !depsSetB.has('v4') || depsSetB.size != 4) {
    throw new Error('All views should depend on table B; instead, found the following depending on table B: '+depsSetB);
  }
  if(!depsSetC.has('v1') || !depsSetC.has('v2') || !depsSetC.has('v3') || !depsSetC.has('v4') || depsSetC.size != 4) {
    throw new Error('All views should depend on table C; instead, found the following depending on table C: '+depsSetC);
  }

  console.log("Passed all tests for M-shaped dependency graph (test 3).")
}

testTopologicalSort();
testDependencyGraph();

