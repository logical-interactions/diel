import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import { DielIr } from "../../lib";
import { map } from "d3";
import { DbType, QueryExecutor, findMainDb, findMainDbFromReference} from "../../parser/QueryExecutor";
import * as sqlAst from "../../parser/sqlAstTypes";

export function assertCorrectBaseRelation(ir: DielIr, q: string) {
  const logger = GenerateUnitTestErrorLogger("assertCorrectBaseRelation", q);
  const v4Relation = ir.allDerivedRelations.get("v4");
  // const metadata = new Map();
  const metadata = {["t1"]: DbType.Main}
  const executor = new QueryExecutor(metadata);
  const ast = ir.ast;
  const selUnit = ;//get selection unit from diel ast here
  const mainList = findMainDb(selUnit, []);
  if (mainList != ["t1"]) {
    logger(`Didn't find correct list of tables in  main thread; Got: ${JSON.stringify(mainList, null, 2)}`); 
  }
  


}