import { DependencyTree, getTopologicalOrder } from "../compiler/passes/passesHelper";
import { getDielIr } from "../lib/cli-compiler";
import { ApplyDependencies } from "../compiler/passes/dependnecy";

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


export function testDependencyGraph() {
  // TODO
  // maybe sahana?
  // feb 22: this is important; maybe do this
  testDepGraph1();
  testDepGraph2a();
  testDepGraph2b();
  testDepGraph3();
}

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
  // console.log("ir", query_ir);
  ApplyDependencies(query_ir);
  const deps = query_ir.dependencies;
  console.log("1 tree: ",deps.depTree);
  console.log("1 topo order: ",deps.topologicalOrder);
  // console.log("dependencies", deps);
}

export function testDepGraph2a() {
  const q = `
  CREATE TABLE tA (
    ID text,
    Value int
  );
  
  CREATE TABLE tB (
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
  console.log("2a: ", deps.depTree);
}

//the test case itself doesn't really make sense...just want to make sure some tangled joins/dependencies work
export function testDepGraph2b() {
  const q = `
  CREATE TABLE tA (
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
  console.log("2b: ", deps.depTree);
}

export function testDepGraph3() {
  const q = `
  CREATE TABLE tA (
    ID text,
    Value int
  );
  CREATE TABLE tB (
    ID text,
    Value int
  );
  CREATE TABLE tC (
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
  console.log("3: ", deps.depTree);
}

testTopologicalSort();
testDependencyGraph();