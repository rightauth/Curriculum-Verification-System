var fs = require('fs');

class Expression {
    static TYPE = ['regex', 'group']
    static GROUPS = {
        all :[{"type":"regex","pattern":"........"}],
        test_group: [{"type":"regex","pattern":"01418..."}],
    };

    constructor(type /* String */, value /* String */) {
        // if (!Expression.TYPE.includes(type))
        //     throw `There isn't TYPE '${type}' in "Expression" class`;
        
        this.type = type;
        this.value = value;
    }

    static writeGroup(name, listExpression){
        if (listExpression.length <= 0)
            return false;

        var data = [];
        for( var exp of listExpression ) {
            data.push({
                "type": exp.type,
                "value": exp.value
            })
        }

        fs.writeFile(`data/group_expression/${name}.json`, JSON.stringify(data), function(err) {
            if (err) {
                console.log(err);
                return false;
            }
        });

        return true;
    }

    static async loadGroups(){
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        fs.readdir('data/group_expression', function (err, list) {
            var obj = {};
            // Return the error if something went wrong
            if (err)
              return action(err);
        
            // For every file in the list
            list.forEach(function (file) {
              // Full path of that file
              var path = "data/group_expression/" + file;
              // Get the file's stats
              let rawdata = fs.readFileSync(path);
              let data = JSON.parse(rawdata);
              let expData = []
              
              for (var exp of data)
                expData.push(new Expression(exp.type, exp.value));

              Expression.GROUPS[file.split(".")[0]] = expData;
            });
          });
          await delay(1000);
    }

    validate(value) {
        if (this.type == 'regex')
            return value.search(this.value) >= 0 ? true : false; 
        
        //this.type == group
        let listExp = Expression.GROUPS[this.value];
        if (!listExp) 
            throw `Not found expression group names '${this.value}'`

        for (var exp of listExp) {
            exp = Object.assign(new Expression, exp);
            if (exp.validate(value))
                return true;
        }

        return false;
    }

    static validateAll(value, listExpression) {

        for (var exp of listExpression){
            if (exp.validate(value))
                return true;
        }

        return false;
    }

    static jsonToObj(jsondata){
        return Object.assign(new Expression, jsondata);
    }
}

module.exports = Expression;