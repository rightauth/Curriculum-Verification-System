const Category = require('./category');
const Expression = require('./expression');
var fs = require('fs');

class Course {
    static ExcludeCreditGrade = ['W', 'P', 'F']

    constructor(nameDepartment, startYear, category = []) {
        this.nameDepartment = nameDepartment;
        this.startYear = startYear;
        this.category = category;
    }

    addCategories(listCategory) {
        this.category = listCategory;
    }

    async fillSubject(subjectList, year = "2559"){
        var categoryListInfo = {};
        var expressionCount = {};
        
        var subjectKeyForSort = {};
        for (var i=0; i<subjectList.length; i++){
            subjectKeyForSort[subjectList[i].subject_code] = i;
        }

        subjectList.sort((a, b) => {            
            return a.credit - b.credit || subjectKeyForSort[b.subject_code] - subjectKeyForSort[a.subject_code];
        })

        /* categoryListInfo */
        function getCategoryInfo(listCategory){
            for (var category of listCategory) {
                if (!category.isSubcategory)
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

            var av = aObj.subjectCodeType == 'regex'?a.length:Expression.GROUPS[year][a].priority; 
            var bv = bObj.subjectCodeType == 'regex'?b.length:Expression.GROUPS[year][b].priority;
            
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
                
                if (categoryListItem.countCredit < categoryListItem.atLeastCredit 
                    && Expression.validateExpression(
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
            var countCredit = 0;
            for (let i=0; i<listCategory.length; i++) {
                var category = listCategory[i];
                if (category.isSubcategory && category.subCategory.length > 0){
                    listCategory[i].countCredit = fillCategory(category.subCategory);
                    countCredit += listCategory[i].countCredit;
                    continue;
                }
                
                if (!category.subjects)
                    category.subjects = [];

                for (var exp in expressionCount){
                    var expCount = expressionCount[exp];
                    
                    if (expCount.subjectCategory == category.categoryName){
                        category.subjects = [...category.subjects, ...expCount.subjectList];
                        listCategory[i].countCredit = categoryListInfo[category.categoryName].countCredit;
                        countCredit += listCategory[i].countCredit;
                    }
                }
            }
            return countCredit;
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

    getStatus(){
        var numForStatusItem = 0;
        function getCategoryInfo(listCategory){
            for (var category of listCategory) {
                if (numForStatusItem == 2)
                    break;

                if (!category.isSubcategory){
                    if (category.countCredit < category.atLeastCredit){
                        numForStatusItem = 2;
                        break;
                    }

                    var subjectGradeN = 0;
                    for (var subject of category.subjects){
                        if (subject.grade == 'N')
                            subjectGradeN += subject.credit;
                    }

                    if ((category.countCredit - subjectGradeN) < category.atLeastCredit)
                        numForStatusItem = 1;
                }

                if (category.subCategory.length > 0)
                    getCategoryInfo(category.subCategory);
            }
        }
        getCategoryInfo(this.category);

        return this.getStatusItem(numForStatusItem);
    }
    
    getStatusItem(NUM){
        if (NUM == 0)
            return {
                name: "ลงทะเบียนครบ",
                color: "darkgreen"
            };

        if (NUM == 1)
            return {
                name: "ลงทะเบียนครบ (แต่เกรดยังออกไม่ครบ)",
                color: "green"
            };

        if (NUM == 2)
            return {
                name: "ลงทะเบียนไม่ครบ",
                color: "red"
            };
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