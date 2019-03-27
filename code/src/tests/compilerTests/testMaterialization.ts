import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation, DielAst } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";
import {generateSqlFromDielAst, generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { ConsoleErrorListener } from "antlr4ts";

import { TransformAstForMaterialization } from "../../compiler/passes/materialization";

export function testMaterialization() {

      const logger = GenerateUnitTestErrorLogger("assertBasicOperators", a1);
      let ast = getDielAst(a1);
      console.log(ast.relations[0]);
      console.log(ast.programs.forEach(value => {
            console.log(value[1]);
      }));
      let ast2 = getDielAst(q1);
      let transformedAST = TransformAstForMaterialization(ast2);
}

// 1. simple. Materialize v1
let q1 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);
create view v1 as select a + 1 as aPrime from t1 where a > 2;
create output o1 as select aPrime from v1 join t2 where aPrime = a;
create output o2 as select aPrime from v1 join t3 where aPrime = a;
`;

let a1 =
`
create table v1 (aPrime integer);
create program after (t1)
	begin
		delete from v2;
		insert into v2 select a + 1 as aPrime from v1;
  end;
`;

// 2. multiple views to materialize horizontally. Materialize v1, v2
let q2 =
`
create table t1 (a integer);
create table t2 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t1 where a > 2;

create output o1 as select aPrime from v1 join v2 where aPrime = a;
create output o2 as select aPrime from v2 join v1 where aPrime = a;
`;

// 3. only views that have more than 1 dependency. Materialize v2
let q3 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t2 where a > 2;
create view v3 as select a + 1 as aPrime from t3 where a > 2;

create output o1 as select aPrime from v1 join v2 where aPrime = a;
create output o2 as select aPrime from v2 join v3 where aPrime = a;
`;

// 4. nested views. Materialize v2
let q4 =
`
create table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from v1 where a > 2;

create output o1 as select aPrime from v2 where aPrime = a;
create output o2 as select aPrime from v2 where aPrime = a;
`;


// 5. complex view query
let q5 = `
create table t1 (a integer);

create view filtered as
select count(*), arrival from LATEST t1
where arrival > 10
group by arrival
order by count DESC
limit 10
constrain check (arrival > 10);

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let a3 =
// `
// create program after 
//  begin
//    delete * from v1;
//    insert into v1
//    select a + 1 from t1 where a > 2;
//  end;
// `;



`
create table v1 (aPrime integer);
CREATE PROGRAM AFTER (ueClickEvent, ueUndoEvent)
  BEGIN
    INSERT INTO ueAllSelections 
    SELECT * FROM ueCurrentSelection;
  END;`;