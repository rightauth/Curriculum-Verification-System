const Expression = require('./expression');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

//Expression.writeGroup("test_group", [new Expression('regex', '01418Xxx')]);
async function a(){
    Expression.loadGroups()
    await delay(1000)
    console.log(Expression.GROUPS)
    var test = new Expression("regex", "1234");
    var test2 = new Expression("group", "test_group");
    console.log(test.validate("1234"), test.validate("1111"))
    console.log(test2.validate("01418113"), test2.validate("111111111"))
};

a();