const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
var fs = require('fs');

class Expression {
    static TYPE = ['regex', 'group']
    static GROUPS = {
        all :[{"type":"regex","pattern":"(.*?)"}],
        test_group: [{"type":"regex","pattern":"01418..."}],
    };

    constructor(name /* String */, type /* String */, pattern /* String */) {
        // if (!Expression.TYPE.includes(type))
        //     throw `There isn't TYPE '${type}' in "Expression" class`;
        
        this.name = name;
        this.type = type;
        this.pattern = pattern;
    }

    static writeGroup(name, descriptionName, listExpression){
        if (listExpression.length <= 0)
            return false;

        var data = [];
        for( var exp of listExpression ) {
            data.push({
                "name": exp.name,
                "type": exp.type,
                "pattern": exp.pattern
            })
        }

        var finalObj = {
            idName: name,
            name: descriptionName, 
            values: data,
        }

        fs.writeFile(`data/group_expression/${name}.json`, JSON.stringify(finalObj), function(err) {
            if (err) {
                console.log(err);
                return false;
            }
        });

        return true;
    }

    static loadGroups(year=2559){
        fs.readdir(`data/group_expression/${year}`, function (err, list) {
            var obj = {};
            // Return the error if something went wrong
            if (err)
              return action(err);
        
            // For every file in the list
            list.forEach(function (file) {
              // Full path of that file
              var path = `data/group_expression/${year}/` + file;
              // Get the file's stats
              let rawdata = fs.readFileSync(path);
              let data = JSON.parse(rawdata);
              let expData = []
              
              for (var exp of data.values)
                expData.push(new Expression(exp.name, exp.type, exp.pattern));

              data.values = expData;

              Expression.GROUPS[file.split(".")[0]] = data;
            });
          });
    }

    validate(value) {
        if (this.type == 'regex')
            return value.search(this.value) >= 0 ? true : false; 
        
        //this.type == group
        let listExp = Expression.GROUPS[this.value].values;
        if (!listExp) 
            throw `Not found expression group names '${this.value}'`

        for (var exp of listExp) {
            exp = Object.assign(new Expression, exp);
            if (exp.validate(value))
                return true;
        }

        return false;
    }

    static validateExpression(expressionValue, value, type="regex"){
        if (type == 'regex'){
            if (expressionValue.length < 8)
                expressionValue = expressionValue + ".".repeat(8-expressionValue.length);
                
            return value.search(expressionValue) >= 0 ? true : false; 
        }
        
        //this.type == group
        let listExp = Expression.GROUPS[expressionValue].values;
        if (!listExp) 
            throw `Not found expression group names '${expressionValue}'`

        for (var exp of listExp) {
            exp = Object.assign(new Expression, exp);
            if (Expression.validateExpression(exp.pattern, value)){
                return true;
            }
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