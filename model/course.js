const Category = require('./category');
const Expression = require('./expression');
var fs = require('fs');

class Course {
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

        /* Initial expressionCount */
        for(let i=0; i<this.semesterYears.length; i++){
            for (var subject of this.semesterYears[i].firstSemester){
                if (!(subject.subjectCode in expressionCount))
                    expressionCount[subject.subjectCode] = {
                        "subjectCode": subject.subjectCode,
                        "subjectCodeType": subject.subjectCodeType,
                        "subjectCategory": subject.subjectCategory,
                        "subjectList": [],
                    }
            }

            for (var subject of this.semesterYears[i].secondSemester){
                if (!(subject.subjectCode in expressionCount))
                    expressionCount[subject.subjectCode] = {
                        "subjectCode": subject.subjectCode,
                        "subjectCodeType": subject.subjectCodeType,
                        "subjectCategory": subject.subjectCategory,
                        "subjectList": [],
                    }
            }
        }

        /* First round: with condition countCredit < atLeastCredit */
        for (var exp in expressionCount){
            var expCount = expressionCount[exp];
            var categoryListItem = categoryListInfo[expCount.subjectCategory];
            for (let i=0; i<subjectList.length; i++){
                var subject = subjectList[i];
                if (subject == null)
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
                if (subject == null)
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

        // console.log(expressionCount)
        
        // /* Third round: search possible way */
        // var creditNotEnoughCategory = [];
        // for (var key of categoryListInfo){
        //     var category = categoryListInfo[key];
        //     if (category.countCredit < category.atLeastCredit){
        //         creditNotEnoughCategory.push(key);
        //     }
        // }

        // for (var expKey of expressionCount){
        //     var expCount = expressionCount[expKey];
        //     if (creditNotEnoughCategory.includes(expCount.subjectCategory)){
        //         for (var expKeyTake of expressionCount){
        //             var expCountTake = expressionCount[expKeyTake];

        //             if (expCountTake.subjectCategory != expCount.subjectCategory){

        //             }
        //         }
        //     }
        // }

        /* Fill Category */
        function fillCategory(listCategory){
            for (var category of listCategory) {
                if (category.expression == null)
                    continue;
                
                if (!category.subjects)
                    category.subjects = [];

                for (var exp in expressionCount){
                    var expCount = expressionCount[exp];
                    
                    // console.log(expCount.subjectCategory == category.categoryName, expCount.subjectCategory, category.categoryName);
                    if (expCount.subjectCategory == category.categoryName){
                        category.subjects = [...category.subjects, expCount.subjectList];
                        
                    }
                }

                if (category.subCategory.length > 0){
                    fillCategory(category.subCategory);
                }
            }
        }
        fillCategory(this.category);

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