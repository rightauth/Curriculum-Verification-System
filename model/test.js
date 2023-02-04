const Expression = require('./expression');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

//Expression.writeGroup("test_group", [new Expression('regex', '01418Xxx')]);
async function a(){
    Expression.loadGroups()
    await delay(1000)
    console.log(Expression.GROUPS)
};

a();