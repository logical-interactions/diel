

import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
import { testTopologicalSort, testDistributionLogc } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";
import { assertBasicConstraints } from "./parserTests/constraintsTest";
import { assertFunctionParsing } from "./parserTests/functionTest";
import { assertLatestSyntax } from "./compilerTests/testSyntaxSugar";
import { codeGenBasicSQLTest } from "./sqlCodeGenTest";
import { getDielIr } from "../src/compiler/compiler";

// TODO: refactor tests to share more compiling and save some time...

const q = `
create event table t1 (
  a int,
  b int
);
create event table t2 (
  c text,
  b int
);

create view v1 as select a from t1 join t2 on t1.b = t2.b where c = 'cat';
create view v2 as select a from t1 join (select max(b) as b from t2) m on m.b = t1.b;
create view v3 as select a from t1 where b in (select b from t2 where c = 'hello');
`;

testDistributionLogc();
assertLatestSyntax(); // LUCIE TODO

testTopologicalSort();


assertBasicConstraints();
codeGenBasicSQLTest();
assertBasicOperators();
assertSimpleType();
assertAllStar();
assertMultiplyType();

const ir = getDielIr(q);
assertBasicNormalizationOfRelation(ir, q);
assertFunctionParsing(ir, q);

