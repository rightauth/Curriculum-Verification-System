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
        this.fillRoundOne(subjectList, this.category);
        this.fillRoundTwo(subjectList, this.category);

        return this;
    }

    //fill subject with condition sumAllCredit < atLeastCredit
    fillRoundOne(subjectList, listCategory, num=0){
        var countCredit = {}
        for (var category of listCategory) {
            for (let i=0; i<subjectList.length; i++){
                if (category.expression == null)
                    break;

                if (subjectList[i] == null)
                    continue;

                let subject = subjectList[i];
                let categoryName = category.categoryName;
                if (!countCredit.hasOwnProperty(categoryName))
                    countCredit[categoryName] = 0;

                if (countCredit[categoryName] >= category.atLeastCredit)
                    continue;
                
                var result = Expression.validateAll(subject.subject_code, category.expression);
                if (result){
                    category.subjects.push(subject);
                    countCredit[categoryName] += subject.credit;
                    
                    //remove subject from list
                    subjectList[i] = null;
                }
            }
            
            if (category.subCategory.length > 0)
                this.fillRoundOne(subjectList, category.subCategory, num+1)
        }
    }

    //fill subject without condition
    fillRoundTwo(subjectList, listCategory){
        subjectList = subjectList.filter(x => x != null);

        for (var category of listCategory) {
            for (let i=0; i<subjectList.length; i++){
                if (category.expression == null)
                    break;

                if (subjectList[i] == null)
                    continue;

                let subject = subjectList[i];
                
                var result = Expression.validateAll(subject.subject_code, category.expression);
                if (result){
                    category.subjects.push(subject);
                    
                    //remove subject from list
                    subjectList[i] = null;
                }
            }
            
            if (category.subCategory.length > 0)
                this.fillRoundTwo(subjectList, category.subCategory)
        }
    }

    async fillSubjectCourse(subjectList){
        this.fillRoundOne(subjectList, this.category);
        this.fillRoundTwo(subjectList, this.category);

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