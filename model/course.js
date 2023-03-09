const Category = require('./category');
const Expression = require('./expression');
var fs = require('fs');

class Course {
    static ExcludeCreditGrade = ['W', 'P']

    constructor(nameDepartment, startYear, category = []) {
        this.nameDepartment = nameDepartment;
        this.startYear = startYear;
        this.category = category;
    }

    addCategories(listCategory) {
        this.category = listCategory;
    }

    async fillSubject(subjectList){
        var categoryListInfo = {};
        var expressionCount = {};

        /* categoryListInfo */
        function getCategoryInfo(listCategory){
            for (var category of listCategory) {
                if (category.expression == null)
                    continue;
                
                categoryListInfo[category.categoryName] = {
                    "name": category.categoryName,
                    "atLeastCredit": category.atLeastCredit,
                    "countCredit": 0,
                }

                if (category.subCategory.length > 0)
                    getCategoryInfo(category.subCategory);
            }
        }
        getCategoryInfo(this.category);

        /* #############################################################################
            sort expressionCount before fill subject sort by 'regex' and 'group' // 
             1. regex come first
             2. full subject code is first.
               for example "01418112" and "01418"
               ans. "01418112" will come first.  
           ############################################################################# */
        /* Initial expressionCount type='regex' --> regex is first priority */
        for(let i=0; i<this.semesterYears.length; i++){
            for (var subject of this.semesterYears[i].firstSemester){
                if (!(subject.subjectCode in expressionCount))
                    expressionCount[subject.subjectCode] = {
                        "subjectCode": subject.subjectCode,
                        "subjectName": subject.subjectName,
                        "subjectCodeType": subject.subjectCodeType,
                        "subjectCategory": subject.subjectCategory,
                        "subjectList": [],
                    }
            }

            for (var subject of this.semesterYears[i].secondSemester){                  
                if (!(subject.subjectCode in expressionCount))
                    expressionCount[subject.subjectCode] = {
                        "subjectCode": subject.subjectCode,
                        "subjectName": subject.subjectName,
                        "subjectCodeType": subject.subjectCodeType,
                        "subjectCategory": subject.subjectCategory,
                        "subjectList": [],
                    }
            }
        }
        /* sort by length of subjectCode */
        expressionCount = Object.keys(expressionCount).sort((a, b) => {
            var aObj = expressionCount[a];
            var bObj = expressionCount[b];

            var av = aObj.subjectCodeType == 'regex'?a.length:Expression.GROUPS[a].priority; 
            var bv = bObj.subjectCodeType == 'regex'?b.length:Expression.GROUPS[b].priority;
            
            return bv - av;
        }).reduce(
            (obj, key) => { 
              obj[key] = expressionCount[key]; 
              return obj;
        }, {});

        /* First round: with condition countCredit < atLeastCredit */
        for (var exp in expressionCount){
            var expCount = expressionCount[exp];
            var categoryListItem = categoryListInfo[expCount.subjectCategory];
            for (let i=0; i<subjectList.length; i++){
                var subject = subjectList[i];
                if (subject == null || Course.ExcludeCreditGrade.includes(subject.grade))
                    continue;
                
                if (Expression.validateExpression(
                    expCount.subjectCode, 
                    subject.subject_code, 
                    expCount.subjectCodeType) && 
                    categoryListItem.countCredit < categoryListItem.atLeastCredit)
                {
                    expCount.subjectList.push(subject);
                    categoryListItem.countCredit += subject.credit;
                    subjectList[i] = null;
                }
            }
        }

        /* Second Round: without condition */
        for (var exp in expressionCount){
            var expCount = expressionCount[exp];
            var categoryListItem = categoryListInfo[expCount.subjectCategory];
            for (let i=0; i<subjectList.length; i++){
                var subject = subjectList[i];
                if (subject == null || Course.ExcludeCreditGrade.includes(subject.grade))
                    continue;
                
                if (Expression.validateExpression(
                    expCount.subjectCode, 
                    subject.subject_code, 
                    expCount.subjectCodeType))
                {
                    expCount.subjectList.push(subject);
                    categoryListItem.countCredit += subject.credit;
                    subjectList[i] = null;
                }
            }
        }
        /* Third round: search possible way */
        var creditNotEnoughCategory = [];
        for (var key in categoryListInfo){
            var category = categoryListInfo[key];
            if (category.countCredit < category.atLeastCredit){
                creditNotEnoughCategory.push(key);
            }
        }

        for (var expKey in expressionCount){
            var expCount = expressionCount[expKey];
            if (creditNotEnoughCategory.includes(expCount.subjectCategory)){
                for (var expKeyTake in expressionCount){
                    var expCountTake = expressionCount[expKeyTake];

                    if (expCountTake.subjectCategory != expCount.subjectCategory){
                        for (let i=0; i<expCountTake.subjectList.length; i++){
                            if (categoryListInfo[expCount.subjectCategory].countCredit >= 
                                categoryListInfo[expCount.subjectCategory].atLeastCredit)
                                break;

                            if (!expCountTake.subjectList[i])
                                continue;

                            if (categoryListInfo[expCountTake.subjectCategory].countCredit - expCountTake.subjectList[i].credit 
                                    < categoryListInfo[expCountTake.subjectCategory].atLeastCredit)
                                continue;

                            if (Expression.validateExpression(
                                expCount.subjectCode, 
                                expCountTake.subjectList[i].subject_code, 
                                expCount.subjectCodeType))
                            {
                                expCount.subjectList.push(expCountTake.subjectList[i]);
                                categoryListInfo[expCountTake.subjectCategory].countCredit -= expCountTake.subjectList[i].credit;
                                categoryListInfo[expCount.subjectCategory].countCredit += expCountTake.subjectList[i].credit;
                                expCountTake.subjectList[i] = null;
                            }
                        }

                        expCountTake.subjectList = expCountTake.subjectList.filter(x => x!= null);
                    }
                }
            }
        }

        // console.log(expressionCount['wellness-others'].subjectList)
        // console.log(Object.keys(expressionCount));

        /* Fill Category */
        function fillCategory(listCategory){
            for (let i=0; i<listCategory.length; i++) {
                var category = listCategory[i];
                if (category.expression == null)
                    continue;
                
                if (!category.subjects)
                    category.subjects = [];

                for (var exp in expressionCount){
                    var expCount = expressionCount[exp];
                    
                    // console.log(expCount.subjectCategory == category.categoryName, expCount.subjectCategory, category.categoryName);
                    if (expCount.subjectCategory == category.categoryName){
                        category.subjects = [...category.subjects, ...expCount.subjectList];
                        listCategory[i].countCredit = categoryListInfo[category.categoryName].countCredit;
                    }
                }

                if (category.subCategory.length > 0){
                    fillCategory(category.subCategory);
                }
            }
        }
        fillCategory(this.category);

        /* Fill Semester */
        for(let i=0; i<this.semesterYears.length; i++){
            for (let k=0; k < this.semesterYears[i].firstSemester.length; k++){
                var subject = this.semesterYears[i].firstSemester[k];
                var expCountSubject = expressionCount[subject.subjectCode].subjectList.pop();
                if (expCountSubject != undefined){
                    this.semesterYears[i].firstSemester[k].data = expCountSubject;
                }
            }

            for (let k=0; k < this.semesterYears[i].secondSemester.length; k++){
                var subject = this.semesterYears[i].secondSemester[k];               
                var expCountSubject = expressionCount[subject.subjectCode].subjectList.pop();
                if (expCountSubject != undefined){
                    this.semesterYears[i].secondSemester[k].data = expCountSubject;
                }
            }
        }

        return this;
    }

    static jsonToObj(jsondata){
        var categoryResult = [];
        for (var x of jsondata.category){
            categoryResult.push(Category.jsonToObj(x));
        }

        return Object.assign(new Course, jsondata);
    }

    static async getCourseExample(){
        let rawdata = fs.readFileSync('data/mock_up_data/course.json');
        let data = JSON.parse(rawdata);
        let objData = Course.jsonToObj(data);

        return objData;
    }

    static async getGradesExample(){
        let rawdata = fs.readFileSync('data/mock_up_data/grades.json');
        let data = JSON.parse(rawdata);

        return data;
    }

    static writeCourse(name, objdata){

        fs.writeFile(`data/course/${name}.json`, JSON.stringify(objdata), function(err) {
            if (err) {
                console.log(err);
                return false;
            }
        });

        return true;
    }
}

module.exports = Course;