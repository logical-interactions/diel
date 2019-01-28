import * as sqlAst from "./sqlAstTypes";
import { Database } from "sql.js";
import { generateSelectionUnit } from "../compiler/codegen/codeGenSql";

enum DbType {
  Main,
  Worker
}

// //q is the query
// function findMainDbFromReference(r: sqlAst.RelationReference, q: sqlAst.SelectionUnit) {
//     if (r.relationName) {
//       if (this.isMain(q.baseRelation.relationName)) {
        
//       // share with worker
//       // delete existing
//       // insert all
//         }
//     } else {
//     // subquery 
//         r.subquery.compositeSelections.map(s => {
//         findMainDb(s.relation);
//         })
//     return r.relationName;
//   }
// }

//return a list of table names in this query that are in the main db
//this way, in QueryExecutor, we can copy the tables over to the worker
export function findMainDb(selection: sqlAst.SelectionUnit) {
    var rels: sqlAst.RelationReference[] = [];
    // first look at baseRelation
    const r = selection.baseRelation;
    if (this.isMain(r.relationName)) {
        rels.push()
    }
    selection.joinClauses.map(c => rels.push(c.relation))
    // do the same for join
    return rels;
}

class queryExecutor {
  mainDb: Database;
  workerDb: Database;
  metaData: {[index: string]: DbType};
  constructor(workerUrl: string) {
    this.mainDb = new Database();
    this.workerDb = new Worker(workerUrl);
    //add in the tables to the respective DBs now
    //maybe pass metadata into the constructor

    this.metaData = {
      "t1": DbType.Main,
      "t2": DbType.Worker
    };
  }
  isMain(rName: string) {
    return this.metaData[rName] == DbType.Main;
  }
  Execute(q: sqlAst.SelectionUnit) {
    // check if baseRelation is in Main
    if (this.isMain(q.baseRelation.relationName)) {
      //copy base relation to worker; is this syntax ok? finding conflicting things online
      var sql_code = "SELECT * INTO ${q.baseRelation.relationName} FROM ${q.baseRelation.relationName}"; 
      this.workerDb.postMessage({
        action: "exec",
        sql: sql_code
      })
    }
    //get list of relations in main
    var mainTables = findMainDb(q)
    //copy over to worker
    findMainDb(q).map(s => this.workerDb.postMessage({
      action: "exec",
      sql: "SELECT * INTO ${s} FROM ${s}"
    }))
    //execute on worker
    this.workerDb.postMessage({
      action: "exec",
      sql: generateSelectionUnit(q)
    })
  }
}