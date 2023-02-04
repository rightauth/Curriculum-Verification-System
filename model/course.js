var Expression = require('./expression');

class Course {
    constructor(nameDepartment, startYear, category = []) {
        this.nameDepartment = nameDepartment;
        this.startYear = startYear;
        this.category = category;
    }

    addCategories(listCategory) {
        this.category = listCategory;
    }

    fillSubject(subjectList){
        this.fillRoundOne(subjectList, this.category);
        this.fillRoundTwo(subjectList, this.category);
    }

    //fill subject with condition sumAllCredit < atLeastCredit
    fillRoundOne(subjectList, listCategory){
        var countCredit = {}
        for (var category of listCategory) {
            for (let i=0; i<subjectList.length; i++){
                if (category.expression == null)
                    break;

                if (!subjectList[i])
                    continue;

                let subject = subjectList[i];
                let categoryName = category.categoryName;
                if (!countCredit.hasOwnProperty(categoryName))
                    countCredit[categoryName] = 0;

                if (countCredit[categoryName] >= category.atLeastCredit)
                    continue;
                
                var result = Expression.validateAll(subject.subject_code, category.Expression);
                if (result){
                    category.subject.push(subject);
                    countCredit[categoryName] += subject.credit;
                    
                    //remove subject from list
                    subjectList[i] = null;
                }
            }
            
            if (category.subCategory > 0)
                this.fillRoundOne(subjectList, category.subCategory)
        }
    }

    fillRoundTwo(subjectList, listCategory){
        for (var category of listCategory) {
            for (let i=0; i<subjectList.length; i++){
                if (category.expression == null)
                    break;

                if (!subjectList[i])
                    continue;

                let subject = subjectList[i];
                
                var result = Expression.validateAll(subject.subject_code, category.expression);
                if (result){
                    category.subject.push(subject);
                    
                    //remove subject from list
                    subjectList[i] = null;
                }
            }
            
            if (category.subCategory > 0)
                this.fillRoundTwo(subjectList, category.subCategory)
        }
    }
}

module.exports = Course;