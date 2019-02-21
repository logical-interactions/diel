import * as sqlAst from "./sqlAstTypes";
import { Database } from "sql.js";
import { generateSelectionUnit } from "../compiler/codegen/codeGenSql";

export enum DbType {
  Main,
  Worker
}

//given a relation reference, will return the relation in the main db
//returns nothing if there is no relation in main db
export function findMainDbFromReference(r: sqlAst.RelationReference) {
    if (r.relationName) {
      if (this.isMain(r.relationName)) {
        return r;
        }
    } else {
    // subquery
        const compsels = r.subquery.compositeSelections;
        for(var c of compsels) {
          const selUnit = c.relation;
          return this.findMainDbFromReference(selUnit.baseRelation);
        }
      return;
  }
}

//return a list of table names in this query that are in the main db
//this way, in QueryExecutor, we can copy the tables over to the worker


//TODO (jan 29): implement recursion of subqueries/joins
//test recursive implementation, so come up with multiple test cases
//including list of tables in worker table
export function findMainDb(selection: sqlAst.SelectionUnit, workerTables: sqlAst.RelationReference[]) {
    var rels: sqlAst.RelationReference[] = [];
    // first look at baseRelation
    const r = selection.baseRelation;
    //TODO (feb 5) check if a relation is already in the worker before adding it
    var ref = this.findMainDbFromReference(r);
    if (!workerTables.includes(ref)) {
      rels.push(ref);
    }
    //go through join AST relations and do the same
    var joins = selection.joinClauses;
    for(var j of joins) {
      ref = this.findMainDbFromReference(j.relation);
      if (!workerTables.includes(ref) && !rels.includes(ref)) {
        rels.push(ref);
      }
    }
    return rels;
}

export class QueryExecutor {
  mainDb: Database;
  workerDb: Worker;
  metaData: {[index: string]: DbType};
  constructor(metaData: {[index: string]: DbType}) {
    this.metaData = metaData;
    this.mainDb = new Database();
    //hardcode the location of the url of worker.sql.js; look at example in diel.ts
    this.workerDb = new Worker(`../node_modules/sql.js/js/worker.sql.js`);
    //add in the tables to the respective DBs now

    // this.metaData = {
    //   "t1": DbType.Main,
    //   "t2": DbType.Worker
    // };
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
    };

    //use metadata to get list of DBs in worker
    var workerTables: sqlAst.RelationReference[] = [];
    //get list of relations in main
    var mainTables = findMainDb(q, workerTables)
    //copy over to worker
    findMainDb(q, workerTables).map(s => this.workerDb.postMessage({
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