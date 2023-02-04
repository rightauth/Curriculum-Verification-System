var fs = require('fs');

class Expression {
    static TYPE = ['regex', 'group']
    static GROUPS = {};

    constructor(type /* String */, pattern /* String */) {
        if (!Expression.TYPE.includes(type))
            throw `There isn't TYPE '${type}' in "Expression" class`;
        
        this.type = type;
        this.pattern = pattern;
    }

    static writeGroup(name, listExpression){
        if (listExpression.length <= 0)
            return false;

        var data = [];
        for( var exp of listExpression ) {
            data.push({
                "type": exp.type,
                "pattern": exp.pattern
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
                expData.push(new Expression(exp.type, exp.pattern));

              Expression.GROUPS[file.split(".")[0]] = expData;
            });
          });

        return null;
    }

    validate(value) {
        if (this.type == 'regex')
            return value.search(this.pattern) >= 0 ? true : false; 
        
        //this.type == group
        let listExp = Expression.GROUPS[this.pattern];
        if (!listExp) 
            throw `Not found expression group names '${this.pattern}'`

        for (var exp of listExp) {
            if (exp.validate(value))
                return true;
        }

        return false;
    }
}

module.exports = Expression;